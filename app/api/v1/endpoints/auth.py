from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, HTTPException, Query, Response
from fastapi.responses import RedirectResponse

from app.auth_tokens import (
    RefreshSession,
    create_jwt,
    decode_jwt,
    future_ts,
    new_jti,
    new_state_token,
    refresh_session_store,
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
        raise HTTPException(status_code=503, detail="Auth JWT secret is not configured securely.")
    return secret


def _cookie_settings() -> dict[str, Any]:
    settings = get_settings()
    return {
        "httponly": True,
        "secure": settings.auth_secure_cookies,
        "samesite": "lax",
        "path": "/",
    }


def _build_kakao_login_url(state: str) -> str:
    settings = get_settings()
    if not settings.kakao_rest_api_key:
        raise HTTPException(status_code=503, detail="Kakao login is not configured.")

    params = {
        "response_type": "code",
        "client_id": settings.kakao_rest_api_key,
        "redirect_uri": settings.kakao_redirect_uri,
        "state": state,
    }
    return f"{KAKAO_AUTHORIZE_URL}?{urlencode(params)}"


def _make_access_token(user: dict[str, Any]) -> str:
    settings = get_settings()
    payload = {
        "sub": user["userId"],
        "provider": user["provider"],
        "nickname": user.get("nickname"),
        "email": user.get("email"),
        "type": "access",
        "iat": utc_now(),
        "exp": future_ts(settings.auth_access_token_ttl_seconds),
    }
    return create_jwt(payload, _require_auth_secret())


def _make_refresh_token(user: dict[str, Any]) -> tuple[str, RefreshSession]:
    settings = get_settings()
    jti = new_jti()
    expires_at = future_ts(settings.auth_refresh_token_ttl_seconds)
    payload = {
        "sub": user["userId"],
        "provider": user["provider"],
        "type": "refresh",
        "jti": jti,
        "iat": utc_now(),
        "exp": expires_at,
    }
    token = create_jwt(payload, _require_auth_secret())
    session = RefreshSession(
        jti=jti,
        user_id=user["userId"],
        token_hash=token_digest(token),
        expires_at=expires_at,
        provider=user["provider"],
        nickname=user.get("nickname"),
        email=user.get("email"),
    )
    return token, session


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


def _current_user_from_access_token(access_token: str | None) -> dict[str, Any]:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = decode_jwt(access_token, _require_auth_secret(), expected_type="access")
    return {
        "userId": payload["sub"],
        "provider": payload.get("provider", "kakao"),
        "nickname": payload.get("nickname"),
        "email": payload.get("email"),
    }


def _refresh_session_from_cookie(refresh_token: str | None) -> tuple[dict[str, Any], str]:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token.")
    payload = decode_jwt(refresh_token, _require_auth_secret(), expected_type="refresh")
    jti = payload.get("jti")
    if not isinstance(jti, str):
        raise HTTPException(status_code=401, detail="Invalid refresh token.")
    session = refresh_session_store.get(jti)
    if not session:
        raise HTTPException(status_code=401, detail="Refresh session expired.")
    if session.token_hash != token_digest(refresh_token):
        refresh_session_store.delete(jti)
        raise HTTPException(status_code=401, detail="Refresh session mismatch.")
    user = {
        "userId": session.user_id,
        "provider": session.provider,
        "nickname": session.nickname,
        "email": session.email,
    }
    return user, jti


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
            raise HTTPException(status_code=token_response.status_code, detail="Kakao token exchange failed.")
        token_data = token_response.json()

        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=502, detail="Kakao access token missing.")

        user_response = await client.get(
            KAKAO_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_response.status_code >= 400:
            raise HTTPException(status_code=user_response.status_code, detail="Kakao user info request failed.")
        user_data = user_response.json()

    kakao_account = user_data.get("kakao_account") or {}
    profile = kakao_account.get("profile") or {}
    kakao_id = user_data.get("id")
    if kakao_id is None:
        raise HTTPException(status_code=502, detail="Kakao user id missing.")

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
async def kakao_login() -> RedirectResponse:
    settings = get_settings()
    _require_auth_secret()
    if not settings.kakao_rest_api_key:
        raise HTTPException(status_code=503, detail="Kakao login is not configured.")

    state = new_state_token()
    response = RedirectResponse(url=_build_kakao_login_url(state))
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
) -> RedirectResponse:
    settings = get_settings()
    try:
        if not state or not oauth_state or state != oauth_state:
            raise HTTPException(status_code=400, detail="OAuth state validation failed.")

        user = await _exchange_kakao_code_for_user(code)
        access_token = _make_access_token(user)
        refresh_token, session = _make_refresh_token(user)
        refresh_session_store.cleanup()
        refresh_session_store.save(session)

        response = RedirectResponse(url=settings.auth_frontend_success_url)
        _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
        response.delete_cookie(STATE_COOKIE_NAME, **_cookie_settings())
        return response
    except HTTPException:
        response = RedirectResponse(url=settings.auth_frontend_failure_url)
        _clear_auth_cookies(response)
        return response


@router.get("/me")
async def auth_me(access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME)) -> dict[str, Any]:
    user = _current_user_from_access_token(access_token)
    return {"ok": True, "authenticated": True, "user": user}


@router.post("/refresh")
async def auth_refresh(
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> Response:
    user, old_jti = _refresh_session_from_cookie(refresh_token)
    refresh_session_store.delete(old_jti)
    access_token = _make_access_token(user)
    new_refresh_token, session = _make_refresh_token(user)
    refresh_session_store.save(session)

    response = Response(
        content='{"ok":true}',
        media_type="application/json",
    )
    _set_auth_cookies(response, access_token=access_token, refresh_token=new_refresh_token)
    return response


@router.post("/logout")
async def auth_logout(
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> Response:
    if refresh_token:
        try:
            payload = decode_jwt(refresh_token, _require_auth_secret(), expected_type="refresh")
            jti = payload.get("jti")
            if isinstance(jti, str):
                refresh_session_store.delete(jti)
        except HTTPException:
            pass

    response = Response(content='{"ok":true}', media_type="application/json")
    _clear_auth_cookies(response)
    return response


@router.get("/session")
async def auth_session(
    access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> dict[str, Any]:
    authenticated = False
    user: dict[str, Any] | None = None

    if access_token:
        try:
            user = _current_user_from_access_token(access_token)
            authenticated = True
        except HTTPException:
            authenticated = False

    return {
        "ok": True,
        "authenticated": authenticated,
        "hasRefreshToken": bool(refresh_token),
        "user": user,
    }
