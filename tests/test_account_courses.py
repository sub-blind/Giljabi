"""내 코스 API의 저장·소유권·삭제를 실제 로컬 PostgreSQL에서 검증한다."""

import os
from contextlib import contextmanager
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.engine import make_url

from app.api.v1.endpoints import auth
from app.config import Settings, get_settings
from app.database import Database
from app.main import create_app
from app.models import Course, CoursePlace


INTENT = {"region": "gangwon", "city": "춘천시", "durationDays": 1,
          "categories": ["attraction", "food"], "keywords": [],
          "preferences": [], "unsupportedConditions": []}


@pytest.fixture
def config(monkeypatch):
    value = Settings(_env_file=None, auth_jwt_secret="test-secret-" * 4)
    monkeypatch.setattr(auth, "get_settings", lambda: value)
    return value


@pytest.fixture
def local_db():
    if os.getenv("STORYROUTE_TEST_DATABASE") != "1":
        pytest.skip("로컬 PostgreSQL 검증은 STORYROUTE_TEST_DATABASE=1로 실행합니다.")
    database = Database(get_settings())
    url = make_url(database.settings.database_url.get_secret_value())
    if (url.host, url.port, url.database) != ("127.0.0.1", 55432, "storyroute"):
        pytest.fail("프로젝트 전용 로컬 DB에서만 실행할 수 있습니다.")
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


def login(database, suffix=""):
    access, refresh = auth._persist_login(database, {"kakaoId": "course-test-" + suffix + uuid4().hex,
                                                     "nickname": "코스 검증"})
    return {auth.ACCESS_COOKIE_NAME: access, auth.REFRESH_COOKIE_NAME: refresh}


@pytest.fixture
def api(local_db, config):
    database, connection = local_db
    app = create_app()
    app.state.database = database
    with TestClient(app) as client:
        client.cookies.update(login(database))
        yield client, database, connection


def save(client, ids=None):
    return client.post("/api/v1/account/courses", json={"title": "춘천 하루 코스",
                       "placeIds": ids or ["12_1001", "39_1002"], "intent": INTENT})


def test_save_list_and_get_course(api):
    client, _, _ = api
    created = save(client)
    assert created.status_code == 201
    body = created.json()
    assert body["title"] == "춘천 하루 코스" and body["placeIds"] == ["12_1001", "39_1002"]
    assert body["intent"] == INTENT
    listed = client.get("/api/v1/account/courses").json()["courses"]
    assert [item["id"] for item in listed] == [body["id"]]
    assert client.get(f"/api/v1/account/courses/{body['id']}").json() == body


def test_unauthenticated_user_cannot_use_course_api(local_db, config):
    database, _ = local_db
    app = create_app(); app.state.database = database
    with TestClient(app) as client:
        assert client.get("/api/v1/account/courses").status_code == 401
        assert save(client).status_code == 401


def test_other_user_cannot_read_or_delete_course(api):
    client, database, _ = api
    course_id = save(client).json()["id"]
    client.cookies.clear(); client.cookies.update(login(database, "other-"))
    assert client.get(f"/api/v1/account/courses/{course_id}").status_code == 404
    assert client.delete(f"/api/v1/account/courses/{course_id}").status_code == 404


def test_delete_course_cascades_places(api):
    client, _, connection = api
    course_id = save(client).json()["id"]
    assert client.delete(f"/api/v1/account/courses/{course_id}").status_code == 204
    assert connection.execute(select(func.count()).select_from(Course).where(Course.id == course_id)).scalar_one() == 0
    assert connection.execute(select(func.count()).select_from(CoursePlace).where(CoursePlace.course_id == course_id)).scalar_one() == 0


@pytest.mark.parametrize("body", [
    {"title": "", "placeIds": ["12_1001"], "intent": INTENT},
    {"title": "코스", "placeIds": ["photo_1001"], "intent": INTENT},
    {"title": "코스", "placeIds": ["12_1001", "12_1001"], "intent": INTENT},
    {"title": "코스", "placeIds": ["12_1", "14_2", "39_3", "12_4"], "intent": INTENT},
])
def test_invalid_course_is_rejected_before_insert(api, body):
    client, _, connection = api
    before = connection.execute(select(func.count()).select_from(Course)).scalar_one()
    assert client.post("/api/v1/account/courses", json=body).status_code == 422
    assert connection.execute(select(func.count()).select_from(Course)).scalar_one() == before
