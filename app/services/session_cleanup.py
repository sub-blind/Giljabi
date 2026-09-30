"""만료·폐기 세션만 정리한다. 회원·저장 코스에는 영향을 주지 않는다."""

import asyncio
import logging

from sqlalchemy import delete, func, or_
from starlette.concurrency import run_in_threadpool

from app.database import DatabaseError
from app.models import AuthSession

logger = logging.getLogger(__name__)


def purge_inactive_sessions(database) -> int:
    with database.begin() as connection:
        result = connection.execute(delete(AuthSession).where(
            or_(AuthSession.revoked_at.is_not(None), AuthSession.expires_at <= func.now())
        ))
        return result.rowcount


async def maintain_sessions(database):
    while True:
        try:
            await run_in_threadpool(purge_inactive_sessions, database)
        except DatabaseError:
            # 연결 주소·SQL·토큰 없이 운영자가 재확인할 수 있는 메시지만 남긴다.
            logger.warning("만료 세션 정리를 완료하지 못했습니다. 다음 주기에 재시도합니다.")
        await asyncio.sleep(3600)
