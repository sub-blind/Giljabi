"""콜백 로그가 정상 진단 정보를 유지하며 인증 쿼리는 노출하지 않는지 확인한다."""

import logging

from app.privacy_logging import configure_privacy_logging


def test_access_log_does_not_expose_oauth_code_or_state(caplog):
    configure_privacy_logging()
    with caplog.at_level(logging.INFO, logger="uvicorn.access"):
        logging.getLogger("uvicorn.access").info('%s - "%s %s HTTP/%s" %d',
            "127.0.0.1:1234", "GET", "/api/v1/auth/kakao/callback?code=private-code&state=private-state", "1.1", 307)
    assert "/api/v1/auth/kakao/callback" in caplog.text and "307" in caplog.text
    assert "private-code" not in caplog.text and "private-state" not in caplog.text
