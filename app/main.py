from contextlib import asynccontextmanager

import time
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config import get_settings
from app.database import Database, DatabaseError, DatabaseNotConfigured
from app.tour_api.client import TourApiError


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        yield
    finally:
        app.state.database.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="StoryRoute 관광 API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.database = Database(settings)

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    hits = defaultdict(deque)

    @app.middleware("http")
    async def protect_day_trip(request: Request, call_next):
        if request.url.path.startswith("/api/v1/day-trip/"):
            if not request.url.path.endswith("/status"):
                now = time.monotonic()
                for key in list(hits):
                    if not hits[key] or now - hits[key][-1] > 60:
                        del hits[key]
                key = request.client.host if request.client else "unknown"
                queue = hits[key]
                while queue and now - queue[0] > 60:
                    queue.popleft()
                if len(queue) >= 30:
                    return JSONResponse({"error": {"code": "RATE_LIMIT", "message": "잠시 쉬었다가 다시 시도해주세요.", "retryable": True}}, status_code=429)
                queue.append(now)
            response = await call_next(request)
            response.headers["Cache-Control"] = "no-store"
            response.headers["X-Content-Type-Options"] = "nosniff"
            return response
        response = await call_next(request)
        if request.url.path.startswith("/api/v1/auth/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(DatabaseError)
    async def database_error(request, error):
        missing = isinstance(error, DatabaseNotConfigured)
        return JSONResponse({"error": {"code": "DATABASE_NOT_CONFIGURED" if missing else "DATABASE_UNAVAILABLE",
                                       "message": str(error), "retryable": not missing}}, status_code=503)

    @app.exception_handler(TourApiError)
    async def tourism_error(request, error):
        return JSONResponse({"error": {"code": "TOUR_API_UNAVAILABLE", "message": str(error),
                                       "retryable": (error.status_code or 502) in {429, 502, 503}}}, status_code=error.status_code or 502)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, error):
        return JSONResponse({"error": {"code": "INVALID_INPUT", "message": "입력 조건이나 선택한 장소를 확인해주세요.", "retryable": False}}, status_code=422)

    @app.get("/healthz")
    async def healthz() -> dict:
        """계약용 헬스 — OpenAPI `/healthz`와 동일 응답 형태."""
        return {"ok": True, "service": "Tourism API"}

    app.include_router(api_v1_router, prefix="/api/v1")
    return app


app = create_app()
