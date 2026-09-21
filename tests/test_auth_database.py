"""인증 실패 응답과 선택 실행하는 로컬 PostgreSQL 로그인 검증. 테스트 데이터는 롤백한다."""

import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import func, insert, select, update
from sqlalchemy.engine import make_url

from app.api.v1.endpoints import auth
from app.auth_tokens import create_jwt, decode_jwt, future_ts, token_digest
from app.config import Settings, get_settings
from app.database import Database, DatabaseUnavailable
from app.main import create_app
from app.models import AuthSession, Course, CoursePlace, User


@pytest.fixture
def config(monkeypatch):
    config = Settings(_env_file=None, auth_jwt_secret="test-secret-" * 4,
                      kakao_rest_api_key="test-key",
                      auth_frontend_success_url="http://testserver/auth/callback?status=success",
                      auth_frontend_failure_url="http://testserver/auth/callback?status=error")
    monkeypatch.setattr(auth, "get_settings", lambda: config)
    return config


@pytest.mark.parametrize("token", ["broken", "a.b.c", "☃.x.y", "...", "e30=.W10=.x"])
def test_malformed_token_is_401(token, config):
    with pytest.raises(HTTPException) as error:
        decode_jwt(token, config.auth_jwt_secret, "access")
    assert error.value.status_code == 401


def test_state_failure_never_calls_kakao_or_database(monkeypatch, config):
    async def forbidden(code):
        pytest.fail("상태 검증 실패 시 외부 인증을 호출하면 안 됩니다.")
    monkeypatch.setattr(auth, "_exchange_kakao_code_for_user", forbidden)
    with TestClient(create_app()) as api:
        response = api.get("/api/v1/auth/kakao/callback?code=test&state=wrong", follow_redirects=False)
        assert response.headers["location"].endswith("status=error")
        assert "Max-Age=0" in response.headers["set-cookie"]


def test_database_failure_is_503_and_guest_health_still_works(config):
    class FailedDatabase:
        @contextmanager
        def connect(self):
            raise DatabaseUnavailable("데이터베이스에 연결하지 못했습니다.")
            yield
        def dispose(self):
            pass
    app = create_app()
    app.state.database = FailedDatabase()
    token = create_jwt({"sub": str(uuid4()), "sid": "test", "type": "access", "exp": future_ts(60)}, config.auth_jwt_secret)
    with TestClient(app) as api:
        api.cookies.set(auth.ACCESS_COOKIE_NAME, token)
        response = api.get("/api/v1/auth/session")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
        assert api.get("/healthz").status_code == 200


@pytest.fixture
def local_db():
    if os.getenv("STORYROUTE_TEST_DATABASE") != "1":
        pytest.skip("로컬 PostgreSQL 검증은 STORYROUTE_TEST_DATABASE=1로 실행합니다.")
    settings = get_settings()
    url = make_url(settings.database_url.get_secret_value())
    if (url.host, url.port, url.database) != ("127.0.0.1", 55432, "storyroute"):
        pytest.fail("검증은 프로젝트 전용 로컬 DB에서만 허용합니다.")
    database = Database(settings)
    with database.connect() as connection:
        transaction = connection.begin()
        class BoundDatabase:
            @contextmanager
            def begin(self):
                with connection.begin_nested():
                    yield connection
            @contextmanager
            def connect(self):
                yield connection
            def dispose(self):
                pass
        try:
            yield BoundDatabase(), connection
        finally:
            transaction.rollback()
    database.dispose()


@pytest.fixture
def external_user():
    return {"kakaoId": "test-" + uuid4().hex, "nickname": "검증 사용자"}


def test_login_upsert_and_only_hash_saved(local_db, external_user, config):
    database, connection = local_db
    access, refresh = auth._persist_login(database, external_user)
    user = auth._current_user_from_access_token(database, access)
    external_user["nickname"] = "수정한 이름"
    auth._persist_login(database, external_user)
    assert connection.execute(select(func.count()).select_from(User).where(User.provider_user_id == external_user["kakaoId"])).scalar_one() == 1
    assert auth._current_user_from_access_token(database, access)["nickname"] == "수정한 이름"
    assert user["userId"] != "kakao:" + external_user["kakaoId"]
    row = connection.execute(select(AuthSession.token_hash).where(AuthSession.id == decode_jwt(refresh, config.auth_jwt_secret)["sid"])).scalar_one()
    assert row == token_digest(refresh) and row != refresh


def test_session_survives_new_application_and_logout_revokes_access(local_db, external_user, config):
    database, connection = local_db
    access, refresh = auth._persist_login(database, external_user)
    # 새 앱 인스턴스에서도 공유 메모리 없이 DB 세션을 확인한다.
    app = create_app()
    app.state.database = database
    with TestClient(app) as api:
        api.cookies.set(auth.ACCESS_COOKIE_NAME, access)
        api.cookies.set(auth.REFRESH_COOKIE_NAME, refresh)
        response = api.get("/api/v1/auth/me")
        assert response.status_code == 200
        assert response.headers["cache-control"] == "no-store"
        assert api.post("/api/v1/auth/logout").status_code == 200
        api.cookies.clear()
        api.cookies.set(auth.ACCESS_COOKIE_NAME, access)
        assert api.get("/api/v1/auth/me").status_code == 401
        assert api.get("/api/v1/auth/session").json()["authenticated"] is False
    with pytest.raises(HTTPException):
        auth._rotate_session(database, refresh)


def test_account_delete_removes_user_sessions_and_saved_courses(local_db, external_user, config):
    database, connection = local_db
    access, refresh = auth._persist_login(database, external_user)
    user_id = UUID(auth._current_user_from_access_token(database, access)["userId"])
    course_id = uuid4()
    with database.begin() as transaction:
        transaction.execute(insert(Course).values(
            id=course_id, user_id=user_id, title="삭제할 춘천 코스",
            intent={"region": "gangwon", "city": "춘천시", "durationDays": 1,
                    "categories": ["attraction"], "keywords": [], "preferences": [],
                    "unsupportedConditions": []}, version=1,
        ))
        transaction.execute(insert(CoursePlace).values(
            id=uuid4(), course_id=course_id, source_service="KorService2",
            content_id="12345", content_type_id="12", position=1,
        ))
    app = create_app()
    app.state.database = database
    with TestClient(app) as api:
        api.cookies.set(auth.REFRESH_COOKIE_NAME, refresh)
        response = api.delete("/api/v1/auth/account")
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        assert "Max-Age=0" in response.headers["set-cookie"]
    assert connection.execute(select(func.count()).select_from(User).where(User.id == user_id)).scalar_one() == 0
    assert connection.execute(select(func.count()).select_from(AuthSession).where(AuthSession.user_id == user_id)).scalar_one() == 0
    assert connection.execute(select(func.count()).select_from(Course).where(Course.id == course_id)).scalar_one() == 0
    assert connection.execute(select(func.count()).select_from(CoursePlace).where(CoursePlace.course_id == course_id)).scalar_one() == 0


def test_refresh_rotation_rejects_replay_and_old_access(local_db, external_user, config):
    database, connection = local_db
    old_access, old_refresh = auth._persist_login(database, external_user)
    access, refresh = auth._rotate_session(database, old_refresh)
    assert auth._current_user_from_access_token(database, access)["nickname"] == external_user["nickname"]
    assert refresh != old_refresh
    with pytest.raises(HTTPException):
        auth._rotate_session(database, old_refresh)
    with pytest.raises(HTTPException):
        auth._current_user_from_access_token(database, old_access)


def test_refresh_failure_rolls_back_old_session_revocation(local_db, external_user, config, monkeypatch):
    database, connection = local_db
    access, refresh = auth._persist_login(database, external_user)
    def fail(user):
        raise RuntimeError("검증용 새 토큰 생성 실패")
    with monkeypatch.context() as patch:
        patch.setattr(auth, "_make_tokens", fail)
        with pytest.raises(RuntimeError):
            auth._rotate_session(database, refresh)
    assert auth._current_user_from_access_token(database, access)["nickname"] == external_user["nickname"]
    assert auth._rotate_session(database, refresh)


def test_expired_session_and_wrong_hash_rejected(local_db, external_user, config):
    database, connection = local_db
    access, refresh = auth._persist_login(database, external_user)
    sid = decode_jwt(refresh, config.auth_jwt_secret)["sid"]
    connection.execute(update(AuthSession).where(AuthSession.id == sid).values(token_hash="0" * 64))
    with pytest.raises(HTTPException):
        auth._rotate_session(database, refresh)
    connection.execute(update(AuthSession).where(AuthSession.id == sid).values(expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)))
    with pytest.raises(HTTPException):
        auth._current_user_from_access_token(database, access)


def test_login_transaction_failure_leaves_no_user(local_db, external_user, config, monkeypatch):
    database, connection = local_db
    def fail(user):
        raise RuntimeError("검증용 세션 생성 실패")
    monkeypatch.setattr(auth, "_make_tokens", fail)
    with pytest.raises(RuntimeError):
        auth._persist_login(database, external_user)
    assert connection.execute(select(func.count()).select_from(User).where(User.provider_user_id == external_user["kakaoId"])).scalar_one() == 0


def test_callback_persists_database_before_setting_cookies(local_db, external_user, config, monkeypatch):
    database, connection = local_db
    async def exchange(code):
        return external_user
    monkeypatch.setattr(auth, "_exchange_kakao_code_for_user", exchange)
    app = create_app()
    app.state.database = database
    with TestClient(app) as api:
        api.cookies.set(auth.STATE_COOKIE_NAME, "test-state")
        response = api.get("/api/v1/auth/kakao/callback?code=mock-code&state=test-state", follow_redirects=False)
        assert response.headers["location"].endswith("status=success")
        assert api.get("/api/v1/auth/me").json()["user"]["nickname"] == external_user["nickname"]
        assert connection.execute(select(func.count()).select_from(User).where(User.provider_user_id == external_user["kakaoId"])).scalar_one() == 1


@pytest.mark.parametrize("request_nickname", [False, True])
def test_login_can_request_only_nickname_consent(request_nickname, config):
    from urllib.parse import urlparse, parse_qs
    with TestClient(create_app()) as api:
        response = api.get("/api/v1/auth/kakao/login", params={"request_nickname": str(request_nickname).lower()}, follow_redirects=False)
        assert response.status_code == 307
        target = urlparse(response.headers["location"])
        assert target.netloc == "kauth.kakao.com"
        query = parse_qs(target.query)
        assert bool(query.get("state"))
        assert query.get("scope") == (["profile_nickname"] if request_nickname else None)
        assert auth.STATE_COOKIE_NAME in response.headers["set-cookie"]
