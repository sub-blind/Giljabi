from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.database import Database, DatabaseNotConfigured, DatabaseUnavailable, get_database

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


class DatabaseHealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    database: Literal["postgresql"] = "postgresql"


@router.get("/health/database", response_model=DatabaseHealthResponse,
            summary="PostgreSQL 실제 연결 확인",
            responses={503: {"description": "DB 설정 없음 또는 실제 연결 실패"}})
def database_health(database: Database = Depends(get_database)):
    # 동기 DB 작업은 FastAPI의 작업 스레드에서 실행한다.
    try:
        database.check()
    except DatabaseNotConfigured:
        return JSONResponse({"error": {"code": "DATABASE_NOT_CONFIGURED",
                                       "message": "데이터베이스 연결 설정이 없습니다.",
                                       "retryable": False}}, status_code=503)
    except DatabaseUnavailable:
        return JSONResponse({"error": {"code": "DATABASE_UNAVAILABLE",
                                       "message": "데이터베이스 연결을 확인해주세요.",
                                       "retryable": True}}, status_code=503)
    return DatabaseHealthResponse()
