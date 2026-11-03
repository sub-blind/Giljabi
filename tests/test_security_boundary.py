"""브라우저 보안 경계와 배포 설정 실수를 회귀 검증한다."""

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.config import Settings
from app.main import create_app


def test_cookie_api_rejects_untrusted_origin():
    with TestClient(create_app()) as api:
        response = api.post(
            "/api/v1/auth/logout",
            headers={"Origin": "https://attacker.example"},
        )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "INVALID_ORIGIN"


def test_cookie_api_allows_configured_origin(monkeypatch):
    settings = Settings(_env_file=None, cors_origins="http://localhost:3000")
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    with TestClient(create_app()) as api:
        response = api.post(
            "/api/v1/auth/logout",
            headers={"Origin": "http://localhost:3000"},
        )

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"


def test_empty_cors_configuration_fails_closed(monkeypatch):
    settings = Settings(_env_file=None, cors_origins="")
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        create_app()
