"""계정·코스·개인 기록의 PostgreSQL 모델. 테이블 생성은 Alembic으로 관리한다."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CHAR, CheckConstraint, DateTime, ForeignKey, Index, Integer, MetaData, SmallInteger, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    type_annotation_map = {datetime: DateTime(timezone=True)}
    metadata = MetaData(naming_convention={
        "pk": "pk_%(table_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "ix": "ix_%(table_name)s_%(column_0_name)s",
    })


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

class User(Timestamps, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_users_provider_identity"),
        CheckConstraint("provider = 'kakao'", name="provider"),
        CheckConstraint("length(btrim(provider_user_id)) > 0", name="provider_user_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    provider: Mapped[str] = mapped_column(String(20))
    provider_user_id: Mapped[str] = mapped_column(String(100))
    nickname: Mapped[str | None] = mapped_column(String(100))


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    __table_args__ = (
        CheckConstraint("token_hash ~ '^[0-9a-f]{64}$'", name="token_hash"),
        Index("ix_auth_sessions_user_id", "user_id"),
        Index("ix_auth_sessions_expires_at", "expires_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(CHAR(64))
    expires_at: Mapped[datetime]
    revoked_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Course(Timestamps, Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("length(btrim(title, E' \\t\\n\\r')) > 0", name="title"),
        CheckConstraint("jsonb_typeof(intent) = 'object'", name="intent_object"),
        CheckConstraint("version > 0", name="version"),
        Index("ix_courses_user_updated", "user_id", text("updated_at DESC")),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(80))
    intent: Mapped[dict] = mapped_column(JSONB)
    started_at: Mapped[datetime | None]
    version: Mapped[int] = mapped_column(Integer, server_default=text("1"))


class CoursePlace(Timestamps, Base):
    __tablename__ = "course_places"
    __table_args__ = (
        UniqueConstraint("course_id", "source_service", "content_id", name="uq_course_places_identity"),
        UniqueConstraint("course_id", "position", name="uq_course_places_position",
                         deferrable=True, initially="IMMEDIATE"),
        CheckConstraint("position BETWEEN 1 AND 3", name="position"),
        CheckConstraint("source_service = 'KorService2'", name="source_service"),
        CheckConstraint("content_type_id IN ('12', '14', '39')", name="content_type_id"),
        CheckConstraint("length(btrim(content_id)) > 0", name="content_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    source_service: Mapped[str] = mapped_column(String(40), server_default=text("'KorService2'"))
    content_id: Mapped[str] = mapped_column(String(30))
    content_type_id: Mapped[str] = mapped_column(String(10))
    position: Mapped[int] = mapped_column(SmallInteger)


class PlaceRecord(Timestamps, Base):
    __tablename__ = "place_records"

    course_place_id: Mapped[UUID] = mapped_column(ForeignKey("course_places.id", ondelete="CASCADE"), primary_key=True)
    visited_at: Mapped[datetime | None]
    memo: Mapped[str] = mapped_column(String(500), server_default=text("''"))
