from __future__ import annotations

from typing import Any
from datetime import datetime, timezone
from uuid import UUID, uuid4
import hmac
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from starlette.concurrency import run_in_threadpool
from sqlalchemy import select, update, func
from sqlalchemy.dialects.postgresql import insert

from app.database import Database, DatabaseError, get_database
from app.models import User, AuthSession

from app.auth_tokens import (
    create_jwt,
    decode_jwt,
    future_ts,
    new_jti,
    new_state_token,
    token_digest,
    utc_now,
)
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])

KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize"
KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me"

ACCESS_COOKIE_NAME = "storyroute_access_token"
REFRESH_COOKIE_NAME = "storyroute_refresh_token"
STATE_COOKIE_NAME = "storyroute_oauth_state"


def _require_auth_secret() -> str:
    secret = get_settings().auth_jwt_secret
    if len(secret) < 32:
        raise HTTPException(status_code=503, detail="로그인 서명 설정을 확인해주세요.")
    return secret


def _cookie_settings() -> dict[str, Any]:
    settings = get_settings()
    return {
        "httponly": True,
        "secure": settings.auth_secure_cookies,
        "samesite": "lax",
        "path": "/",
    }


def _build_kakao_login_url(state: str, *, request_nickname: bool = False) -> str:
    settings = get_settings()
    if not settings.kakao_rest_api_key:
        raise HTTPException(status_code=503, detail="카카오 로그인 설정이 없습니다.")

    params = {
        "response_type": "code",
        "client_id": settings.kakao_rest_api_key,
        "redirect_uri": settings.kakao_redirect_uri,
        "state": state,
    }
    if request_nickname:
        params["scope"] = "profile_nickname"
    return f"{KAKAO_AUTHORIZE_URL}?{urlencode(params)}"


def _make_tokens(user: dict[str, Any]) -> tuple[str, str, dict[str, Any]]:
    settings = get_settings()
    jti = new_jti()
    issued_at = utc_now()
    expires_at = future_ts(settings.auth_refresh_token_ttl_seconds)
    common = {"sub": user["userId"], "provider": "kakao", "iat": issued_at, "sid": jti}
    secret = _require_auth_secret()
    access = create_jwt({**common, "type": "access", "exp": future_ts(settings.auth_access_token_ttl_seconds)}, secret)
    refresh = create_jwt({**common, "type": "refresh", "jti": jti, "exp": expires_at}, secret)
    session = {"id": jti, "user_id": UUID(user["userId"]), "token_hash": token_digest(refresh),
               "expires_at": datetime.fromtimestamp(expires_at, timezone.utc)}
    return access, refresh, session


def _user_data(row) -> dict[str, Any]:
    return {"userId": str(row["id"]), "provider": row["provider"], "nickname": row["nickname"]}


def _persist_login(database: Database, external_user: dict[str, Any]) -> tuple[str, str]:
    # 사용자 중복 방지와 세션 생성을 함께 커밋한다. 카카오 원본 토큰은 보관하지 않는다.
    with database.begin() as connection:
        nickname = external_user.get("nickname")
        if nickname is not None:
            nickname = str(nickname)[:100]
        statement = insert(User).values(id=uuid4(), provider="kakao",
                                        provider_user_id=str(external_user["kakaoId"]), nickname=nickname)
        statement = statement.on_conflict_do_update(
            constraint="uq_users_provider_identity",
            set_={"nickname": statement.excluded.nickname, "updated_at": func.now()},
        ).returning(User.id, User.provider, User.nickname)
        user = _user_data(connection.execute(statement).mappings().one())
        access, refresh, session = _make_tokens(user)
        connection.execute(insert(AuthSession).values(**session))
    return access, refresh


def _set_auth_cookies(response: Response, *, access_token: str, refresh_token: str) -> None:
    settings = get_settings()
    cookie_opts = _cookie_settings()
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        access_token,
        max_age=settings.auth_access_token_ttl_seconds,
        **cookie_opts,
    )
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=settings.auth_refresh_token_ttl_seconds,
        **cookie_opts,
    )


def _clear_auth_cookies(response: Response) -> None:
    cookie_opts = _cookie_settings()
    response.delete_cookie(ACCESS_COOKIE_NAME, **cookie_opts)
    response.delete_cookie(REFRESH_COOKIE_NAME, **cookie_opts)
    response.delete_cookie(STATE_COOKIE_NAME, **cookie_opts)


def _token_identity(token: str | None, token_type: str) -> tuple[dict[str, Any], UUID, str]:
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    payload = decode_jwt(token, _require_auth_secret(), expected_type=token_type)
    try:
        user_id = UUID(payload["sub"])
        sid = payload["sid"]
        if not isinstance(sid, str) or not 1 <= len(sid) <= 64:
            raise ValueError
        if token_type == "refresh" and payload.get("jti") != sid:
            raise ValueError
    except (KeyError, ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=401, detail="다시 로그인해주세요.") from None
    return payload, user_id, sid


def _active_session(connection, user_id: UUID, sid: str, *, lock: bool = False):
    statement = select(AuthSession.token_hash, User.id, User.provider, User.nickname).join(
        User, AuthSession.user_id == User.id
    ).where(AuthSession.id == sid, AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None), AuthSession.expires_at > func.now())
    if lock:
        statement = statement.with_for_update(of=AuthSession)
    row = connection.execute(statement).mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=401, detail="로그인이 만료됐습니다. 다시 로그인해주세요.")
    return row


def _current_user_from_access_token(database: Database, access_token: str | None) -> dict[str, Any]:
    _, user_id, sid = _token_identity(access_token, "access")
    with database.connect() as connection:
        return _user_data(_active_session(connection, user_id, sid))


def _rotate_session(database: Database, refresh_token: str | None) -> tuple[str, str]:
    _, user_id, sid = _token_identity(refresh_token, "refresh")
    with database.begin() as connection:
        row = _active_session(connection, user_id, sid, lock=True)
        if not hmac.compare_digest(row["token_hash"], token_digest(refresh_token)):
            raise HTTPException(status_code=401, detail="다시 로그인해주세요.")
        connection.execute(update(AuthSession).where(AuthSession.id == sid).values(revoked_at=func.now()))
        access, refresh, session = _make_tokens(_user_data(row))
        connection.execute(insert(AuthSession).values(**session))
    return access, refresh


def _revoke_session(database: Database, refresh_token: str | None) -> None:
    if not refresh_token:
        return
    try:
        _, user_id, sid = _token_identity(refresh_token, "refresh")
    except HTTPException as error:
        if error.status_code == 401:
            return
        raise
    with database.begin() as connection:
        connection.execute(update(AuthSession).where(
            AuthSession.id == sid, AuthSession.user_id == user_id,
            AuthSession.token_hash == token_digest(refresh_token),
            AuthSession.revoked_at.is_(None),
        ).values(revoked_at=func.now()))


async def _exchange_kakao_code_for_user(code: str) -> dict[str, Any]:
    settings = get_settings()
    token_payload = {
        "grant_type": "authorization_code",
        "client_id": settings.kakao_rest_api_key,
        "redirect_uri": settings.kakao_redirect_uri,
        "code": code,
    }
    if settings.kakao_client_secret:
        token_payload["client_secret"] = settings.kakao_client_secret

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.post(
            KAKAO_TOKEN_URL,
            data=token_payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_response.status_code >= 400:
            raise HTTPException(status_code=token_response.status_code, detail="카카오 인증을 완료하지 못했습니다.")
        token_data = token_response.json()

        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=502, detail="카카오 인증 응답을 확인하지 못했습니다.")

        user_response = await client.get(
            KAKAO_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_response.status_code >= 400:
            raise HTTPException(status_code=user_response.status_code, detail="카카오 사용자 정보를 가져오지 못했습니다.")
        user_data = user_response.json()

    kakao_account = user_data.get("kakao_account") or {}
    profile = kakao_account.get("profile") or {}
    kakao_id = user_data.get("id")
    if kakao_id is None:
        raise HTTPException(status_code=502, detail="카카오 사용자 식별자를 확인하지 못했습니다.")

    return {
        "userId": f"kakao:{kakao_id}",
        "provider": "kakao",
        "nickname": profile.get("nickname"),
        "email": kakao_account.get("email"),
        "profileImageUrl": profile.get("profile_image_url"),
        "kakaoId": kakao_id,
    }


@router.get("/kakao/login-url")
async def kakao_login_url() -> dict[str, Any]:
    settings = get_settings()
    if not settings.kakao_rest_api_key or len(settings.auth_jwt_secret) < 32:
        return {"enabled": False, "loginUrl": None}
    return {"enabled": True, "loginUrl": "/api/v1/auth/kakao/login"}


@router.get("/kakao/login")
async def kakao_login(request_nickname: bool = Query(default=False)) -> RedirectResponse:
    settings = get_settings()
    _require_auth_secret()
    if not settings.kakao_rest_api_key:
        raise HTTPException(status_code=503, detail="카카오 로그인 설정이 없습니다.")

    state = new_state_token()
    response = RedirectResponse(url=_build_kakao_login_url(state, request_nickname=request_nickname))
    response.set_cookie(
        STATE_COOKIE_NAME,
        state,
        max_age=600,
        **_cookie_settings(),
    )
    return response


@router.get("/kakao/callback")
async def kakao_callback(
    code: str = Query(..., min_length=1),
    state: str | None = None,
    oauth_state: str | None = Cookie(default=None, alias=STATE_COOKIE_NAME),
    database: Database = Depends(get_database),
) -> RedirectResponse:
    settings = get_settings()
    try:
        if not state or not oauth_state or state != oauth_state:
            raise HTTPException(status_code=400, detail="로그인 요청을 확인하지 못했습니다. 다시 시도해주세요.")

        user = await _exchange_kakao_code_for_user(code)
        access_token, refresh_token = await run_in_threadpool(_persist_login, database, user)

        response = RedirectResponse(url=settings.auth_frontend_success_url)
        _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
        response.delete_cookie(STATE_COOKIE_NAME, **_cookie_settings())
        return response
    except (HTTPException, DatabaseError, httpx.HTTPError, ValueError):
        response = RedirectResponse(url=settings.auth_frontend_failure_url)
        _clear_auth_cookies(response)
        return response


@router.get("/me")
def auth_me(access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
            database: Database = Depends(get_database)) -> dict[str, Any]:
    user = _current_user_from_access_token(database, access_token)
    return {"ok": True, "authenticated": True, "user": user}


@router.post("/refresh")
def auth_refresh(refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
                 database: Database = Depends(get_database)) -> Response:
    access_token, refresh_token = _rotate_session(database, refresh_token)
    response = Response(content='{"ok":true}', media_type="application/json")
    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
    return response


@router.post("/logout")
def auth_logout(refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
                database: Database = Depends(get_database)) -> Response:
    _revoke_session(database, refresh_token)
    response = Response(content='{"ok":true}', media_type="application/json")
    _clear_auth_cookies(response)
    return response


@router.get("/session")
def auth_session(access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
                 refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
                 database: Database = Depends(get_database)) -> dict[str, Any]:
    user = None
    if access_token:
        try:
            user = _current_user_from_access_token(database, access_token)
        except HTTPException as error:
            if error.status_code != 401:
                raise
    return {"ok": True, "authenticated": user is not None,
            "hasRefreshToken": bool(refresh_token), "user": user}
