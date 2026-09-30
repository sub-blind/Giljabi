"""기본 Uvicorn 접근 로그에서 OAuth 코드·상태 등 쿼리 값을 제거한다."""

import logging


class AccessLogPrivacyFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple) and len(record.args) == 5:
            address, method, target, protocol, status = record.args
            if isinstance(target, str):
                record.args = (address, method, target.partition("?")[0], protocol, status)
        return True


def configure_privacy_logging():
    logger = logging.getLogger("uvicorn.access")
    if not any(isinstance(item, AccessLogPrivacyFilter) for item in logger.filters):
        logger.addFilter(AccessLogPrivacyFilter())
