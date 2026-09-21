"""로그인한 사용자의 코스 저장·조회·삭제 API."""

from __future__ import annotations

import re
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import Field
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from app.api.v1.endpoints.auth import ACCESS_COOKIE_NAME, _current_user_from_access_token
from app.database import Database, get_database
from app.models import Course, CoursePlace
from app.services.day_trip import CourseRequest, Intent, StrictModel

router = APIRouter(prefix="/account/courses", tags=["내 코스"])


class SaveCourseRequest(CourseRequest):
    title: str = Field(min_length=1, max_length=80)


class SavedCourse(StrictModel):
    id: UUID
    title: str
    intent: Intent
    placeIds: list[str]
    createdAt: datetime
    updatedAt: datetime


class SavedCourseList(StrictModel):
    courses: list[SavedCourse]


def _user_id(database: Database, access_token: str | None) -> UUID:
    user = _current_user_from_access_token(database, access_token)
    return UUID(user["userId"])


def _saved_course(connection, course_id: UUID, user_id: UUID) -> SavedCourse:
    row = connection.execute(select(Course).where(Course.id == course_id, Course.user_id == user_id)).mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="저장한 코스를 찾지 못했어요.")
    place_rows = connection.execute(select(CoursePlace.content_id, CoursePlace.content_type_id)
                                    .where(CoursePlace.course_id == course_id)
                                    .order_by(CoursePlace.position)).all()
    return SavedCourse(id=row["id"], title=row["title"], intent=Intent.model_validate(row["intent"]),
                       placeIds=[f"{kind}_{content_id}" for content_id, kind in place_rows],
                       createdAt=row["created_at"], updatedAt=row["updated_at"])


@router.post("", response_model=SavedCourse, status_code=201)
def save_course(body: SaveCourseRequest,
                access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
                database: Database = Depends(get_database)):
    user_id = _user_id(database, access_token)
    course_id = uuid4()
    with database.begin() as connection:
        connection.execute(insert(Course).values(id=course_id, user_id=user_id, title=body.title,
                                                 intent=body.intent.model_dump(mode="json")))
        for position, place_id in enumerate(body.placeIds, 1):
            match = re.fullmatch(r"(12|14|39)_(\d{1,15})", place_id)
            if match is None:  # CourseRequest에서도 검증하지만 DB 입력 직전에 다시 분리한다.
                raise HTTPException(status_code=422, detail="올바른 장소 ID를 사용해주세요.")
            kind, content_id = match.groups()
            connection.execute(insert(CoursePlace).values(id=uuid4(), course_id=course_id,
                                                           content_id=content_id, content_type_id=kind,
                                                           position=position))
        return _saved_course(connection, course_id, user_id)


@router.get("", response_model=SavedCourseList)
def list_courses(access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
                 database: Database = Depends(get_database)):
    user_id = _user_id(database, access_token)
    with database.connect() as connection:
        ids = connection.execute(select(Course.id).where(Course.user_id == user_id)
                                 .order_by(Course.updated_at.desc()).limit(20)).scalars().all()
        return SavedCourseList(courses=[_saved_course(connection, course_id, user_id) for course_id in ids])


@router.get("/{course_id}", response_model=SavedCourse)
def get_course(course_id: UUID,
               access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
               database: Database = Depends(get_database)):
    user_id = _user_id(database, access_token)
    with database.connect() as connection:
        return _saved_course(connection, course_id, user_id)


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: UUID,
                  access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE_NAME),
                  database: Database = Depends(get_database)):
    user_id = _user_id(database, access_token)
    with database.begin() as connection:
        result = connection.execute(delete(Course).where(Course.id == course_id, Course.user_id == user_id))
        if result.rowcount != 1:
            raise HTTPException(status_code=404, detail="저장한 코스를 찾지 못했어요.")
    return Response(status_code=204)
