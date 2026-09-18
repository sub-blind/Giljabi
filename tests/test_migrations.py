"""DB 접속·인증정보 없이 초기 변경의 SQL 생성이 가능한지 확인한다."""

from io import StringIO

from alembic import command
from alembic.config import Config
import pytest


@pytest.mark.parametrize("direction", ["upgrade", "downgrade"])
def test_offline_migration_needs_no_database_settings(monkeypatch, direction):
    def forbidden():
        raise AssertionError("오프라인 SQL 생성에서는 서버 인증 설정을 읽으면 안 됩니다.")
    monkeypatch.setattr("app.config.get_settings", forbidden)
    output = StringIO()
    config = Config("alembic.ini", output_buffer=output)
    if direction == "upgrade":
        command.upgrade(config, "head", sql=True)
        assert "DEFERRABLE INITIALLY IMMEDIATE" in output.getvalue()
        assert "TIMESTAMP WITH TIME ZONE" in output.getvalue()
        assert "CREATE TABLE place_records" in output.getvalue()
    else:
        command.downgrade(config, "20260918_01:base", sql=True)
        sql = output.getvalue()
        assert sql.index("DROP TABLE place_records") < sql.index("DROP TABLE users")
    assert "postgresql://" not in output.getvalue()
