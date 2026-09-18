"""실제 DB 없이 연결 설정·실패 응답·연결 정리를 확인한다."""

from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.config import Settings
from app.database import Database, DatabaseNotConfigured, DatabaseUnavailable
from app.main import create_app


def settings(**overrides):
    return Settings(_env_file=None, database_url=overrides.get("database_url", ""))


def test_unconfigured_database_is_lazy_and_does_not_block_health():
    database = Database(settings())
    assert database._engine is None
    with pytest.raises(DatabaseNotConfigured):
        database.check()
    app = create_app()
    app.state.database = database
    with TestClient(app) as api:
        assert api.get("/healthz").status_code == 200
        response = api.get("/api/v1/health/database")
        assert response.status_code == 503
        assert response.json()["error"] == {"code": "DATABASE_NOT_CONFIGURED",
                                             "message": "데이터베이스 연결 설정이 없습니다.",
                                             "retryable": False}


@pytest.mark.parametrize("url", ["not-a-url", "sqlite:///test.db", "mysql://user:secret@localhost/db"])
def test_invalid_database_configuration_never_opens_connection(url):
    with pytest.raises(DatabaseUnavailable):
        Database(settings(database_url=url)).check()


@pytest.mark.parametrize("scheme", ["postgres", "postgresql", "postgresql+psycopg"])
def test_postgres_driver_and_pool_are_explicit_without_connecting(monkeypatch, scheme):
    captured = {}
    engine = object()
    def build(url, **kwargs):
        captured.update(url=url, **kwargs)
        return engine
    monkeypatch.setattr("app.database.create_engine", build)
    database = Database(settings(database_url=f"{scheme}://user:secret@localhost:55432/storyroute"))
    assert database._get_engine() is engine
    assert database._get_engine() is engine
    assert captured["url"].drivername == "postgresql+psycopg"
    assert captured["pool_size"] == 2 and captured["max_overflow"] == 0
    assert captured["pool_pre_ping"] is True and captured["hide_parameters"] is True
    assert captured["connect_args"]["connect_timeout"] == 5


def test_connection_error_is_sanitized_and_health_has_no_credentials(monkeypatch):
    class FailedEngine:
        def connect(self):
            raise OperationalError("SELECT 1", {}, RuntimeError("secret-db-password internal-host"))
        def dispose(self):
            pass
    database = Database(settings(database_url="postgresql://user:secret-db-password@internal-host/db"))
    monkeypatch.setattr("app.database.create_engine", lambda *args, **kwargs: FailedEngine())
    with pytest.raises(DatabaseUnavailable) as error:
        database.check()
    assert "secret-db-password" not in str(error.value)
    app = create_app()
    app.state.database = database
    with TestClient(app) as api:
        response = api.get("/api/v1/health/database")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
        assert "secret-db-password" not in response.text and "internal-host" not in response.text


def test_successful_database_health_checks_query_and_disposes_on_shutdown():
    class WorkingDatabase:
        checked = False
        disposed = False
        def check(self):
            self.checked = True
        def dispose(self):
            self.disposed = True
    database = WorkingDatabase()
    app = create_app()
    app.state.database = database
    with TestClient(app) as api:
        response = api.get("/api/v1/health/database")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "database": "postgresql"}
        assert database.checked is True
    assert database.disposed is True


def test_transaction_failure_is_sanitized_and_secret_setting_is_hidden(monkeypatch):
    class FailedEngine:
        @contextmanager
        def begin(self):
            raise OperationalError("private-statement", {"memo": "private-note"}, RuntimeError("secret"))
            yield
    database = Database(settings(database_url="postgresql://user:secret@localhost/db"))
    monkeypatch.setattr("app.database.create_engine", lambda *args, **kwargs: FailedEngine())
    with pytest.raises(DatabaseUnavailable) as error:
        with database.begin():
            pass
    assert "secret" not in str(error.value) and "private-note" not in str(error.value)
    assert "secret" not in repr(database.settings.database_url)
