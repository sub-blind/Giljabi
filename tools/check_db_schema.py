"""로컬 PostgreSQL의 초기 스키마를 검증한다. 확인용 데이터는 모두 롤백한다."""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, inspect, insert, select, text, update
from sqlalchemy.engine import make_url
from sqlalchemy.exc import DBAPIError

from app.config import get_settings
from app.database import Database, DatabaseError
from app.models import AuthSession, Course, CoursePlace, PlaceRecord, User


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    settings = get_settings()
    try:
        url = make_url(settings.database_url.get_secret_value())
        if (url.host, url.port, url.database) != ("127.0.0.1", 55432, "storyroute"):
            print("이 검증은 프로젝트 전용 로컬 DB에서만 실행합니다.")
            return 1
    except ValueError:
        print("로컬 DB 설정을 확인해주세요.")
        return 1
    database = Database(settings)
    try:
        with database.connect() as connection:
            transaction = connection.begin()
            try:
                names = set(inspect(connection).get_table_names())
                expected = {"users", "auth_sessions", "courses", "course_places", "place_records", "alembic_version"}
                assert names == expected, "초기 테이블 목록 불일치"
                assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == "20260918_01"
                user_id, course_id = uuid4(), uuid4()
                tag = str(uuid4())
                connection.execute(insert(User).values(id=user_id, provider="kakao", provider_user_id=tag, nickname="연결 확인"))
                course_values = {"id": course_id, "user_id": user_id, "title": "확인용 코스", "intent": {"city": "춘천시", "durationDays": 1}}
                connection.execute(insert(Course).values(**course_values))
                checks = []

                def reject(label, statement, code):
                    try:
                        with connection.begin_nested():
                            connection.execute(statement)
                    except DBAPIError as error:
                        assert error.orig.sqlstate == code, label
                        checks.append(label)
                    else:
                        raise AssertionError(label)

                reject("사용자 중복 거절", insert(User).values(provider="kakao", provider_user_id=tag), "23505")
                reject("없는 사용자 외래키 거절", insert(Course).values(**{**course_values, "id": uuid4(), "user_id": uuid4()}), "23503")
                reject("빈 제목 거절", insert(Course).values(**{**course_values, "id": uuid4(), "title": " \t\n"}), "23514")
                reject("JSON 객체 외 조건 거절", insert(Course).values(**{**course_values, "id": uuid4(), "intent": []}), "23514")
                reject("잘못된 버전 거절", update(Course).where(Course.id == course_id).values(version=0), "23514")
                ids = [uuid4() for _ in range(3)]
                for position, place_id in enumerate(ids, 1):
                    connection.execute(insert(CoursePlace).values(id=place_id, course_id=course_id,
                                       content_id=f"check-{position}", content_type_id="12", position=position))
                values = {"course_id": course_id, "content_id": "check-4", "content_type_id": "12", "position": 4}
                reject("네 번째 장소 거절", insert(CoursePlace).values(**values), "23514")
                reject("장소 순서 중복 거절", insert(CoursePlace).values(**{**values, "position": 1}), "23505")
                reject("잘못된 콘텐츠 유형 거절", insert(CoursePlace).values(**{**values, "position": 1, "content_type_id": "32"}), "23514")
                reject("다른 서비스 거절", insert(CoursePlace).values(**{**values, "position": 1, "source_service": "Odii"}), "23514")
                connection.execute(delete(CoursePlace).where(CoursePlace.id == ids[2]))
                reject("동일 장소 중복 거절", insert(CoursePlace).values(**{**values, "position": 3, "content_id": "check-1"}), "23505")
                connection.execute(insert(PlaceRecord).values(course_place_id=ids[0], visited_at=datetime.now(timezone.utc), memo="한국어 개인 메모"))
                reject("메모 500자 초과 거절", update(PlaceRecord).where(PlaceRecord.course_place_id == ids[0]).values(memo="가" * 501), "22001")
                reject("장소 기록 중복 거절", insert(PlaceRecord).values(course_place_id=ids[0]), "23505")
                connection.execute(text("SET CONSTRAINTS uq_course_places_position DEFERRED"))
                connection.execute(update(CoursePlace).where(CoursePlace.id == ids[0]).values(position=2))
                connection.execute(update(CoursePlace).where(CoursePlace.id == ids[1]).values(position=1))
                connection.execute(text("SET CONSTRAINTS uq_course_places_position IMMEDIATE"))
                assert connection.execute(select(PlaceRecord.memo).where(PlaceRecord.course_place_id == ids[0])).scalar_one() == "한국어 개인 메모"
                checks.append("순서 교환 후 기록 유지")
                connection.execute(update(PlaceRecord).where(PlaceRecord.course_place_id == ids[0]).values(visited_at=None))
                record = connection.execute(select(PlaceRecord.visited_at, PlaceRecord.memo).where(PlaceRecord.course_place_id == ids[0])).one()
                assert record == (None, "한국어 개인 메모")
                checks.append("방문 체크 해제 후 메모 유지")
                session_id = str(uuid4())
                session = {"id": session_id, "user_id": user_id, "token_hash": "a" * 64, "expires_at": datetime.now(timezone.utc) + timedelta(days=1)}
                reject("잘못된 토큰 해시 형식 거절", insert(AuthSession).values(**{**session, "token_hash": "not-a-hash"}), "23514")
                connection.execute(insert(AuthSession).values(**session))
                connection.execute(delete(User).where(User.id == user_id))
                for model, predicate in [(AuthSession, AuthSession.id == session_id), (Course, Course.id == course_id),
                                         (CoursePlace, CoursePlace.course_id == course_id), (PlaceRecord, PlaceRecord.course_place_id == ids[0])]:
                    assert connection.execute(select(model.__table__).where(predicate)).first() is None
                checks.append("사용자 삭제의 세션·코스·장소·기록 연쇄 삭제")
                for label in checks:
                    print("통과: " + label)
            finally:
                transaction.rollback()
        print(f"실제 DB 검증 {len(checks)}개 통과 · 확인용 데이터 전체 롤백 완료")
        return 0
    except (DatabaseError, AssertionError):
        print("스키마 검증에 실패했습니다. DB 상태와 초기 마이그레이션을 확인해주세요.")
        return 1
    finally:
        database.dispose()


if __name__ == "__main__":
    sys.exit(main())
