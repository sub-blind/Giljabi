"""서버 전용 PostgreSQL 연결과 짧은 연결 확인 쿼리를 관리한다."""

from contextlib import contextmanager
from threading import Lock
from typing import Iterator

from fastapi import Request
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine, make_url
from sqlalchemy.exc import ArgumentError, SQLAlchemyError

from app.config import Settings


class DatabaseError(RuntimeError):
    """연결 주소나 외부 오류 원문을 노출하지 않는 DB 오류."""


class DatabaseNotConfigured(DatabaseError):
    pass


class DatabaseUnavailable(DatabaseError):
    pass


class Database:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._engine: Engine | None = None
        self._lock = Lock()

    def _get_engine(self) -> Engine:
        # 첫 요청 전에는 연결하지 않아 DB 설정이 없는 관광 검색도 실행할 수 있다.
        with self._lock:
            if self._engine is not None:
                return self._engine
            raw_url = self.settings.database_url.get_secret_value().strip()
            if not raw_url:
                raise DatabaseNotConfigured("데이터베이스 연결 설정이 없습니다.")
            try:
                url = make_url(raw_url)
                if url.drivername not in {"postgres", "postgresql", "postgresql+psycopg"}:
                    raise DatabaseUnavailable("PostgreSQL 연결 설정을 확인해주세요.")
                self._engine = create_engine(
                    url.set(drivername="postgresql+psycopg"),
                    pool_size=self.settings.database_pool_size,
                    max_overflow=0,
                    pool_timeout=self.settings.database_connect_timeout_seconds,
                    pool_pre_ping=True,
                    connect_args={
                        "connect_timeout": self.settings.database_connect_timeout_seconds,
                        "options": "-c statement_timeout=5000",
                    },
                    echo=False,
                    hide_parameters=True,
                )
            except (ArgumentError, ValueError, SQLAlchemyError):
                raise DatabaseUnavailable("PostgreSQL 연결 설정을 확인해주세요.") from None
            return self._engine

    @contextmanager
    def connect(self) -> Iterator[Connection]:
        try:
            with self._get_engine().connect() as connection:
                yield connection
        except SQLAlchemyError:
            raise DatabaseUnavailable("데이터베이스에 연결하지 못했습니다.") from None

    @contextmanager
    def begin(self) -> Iterator[Connection]:
        try:
            with self._get_engine().begin() as connection:
                yield connection
        except SQLAlchemyError:
            raise DatabaseUnavailable("데이터베이스 작업을 완료하지 못했습니다.") from None

    def check(self) -> None:
        with self.connect() as connection:
            if connection.execute(text("SELECT 1")).scalar_one() != 1:
                raise DatabaseUnavailable("데이터베이스 응답을 확인하지 못했습니다.")

    def dispose(self) -> None:
        with self._lock:
            if self._engine is not None:
                self._engine.dispose()
                self._engine = None


def get_database(request: Request) -> Database:
    return request.app.state.database
