"""실제 PostgreSQL 연결·임시 데이터 쓰기·읽기를 확인한다. 외부 AI는 호출하지 않는다."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.config import get_settings
from app.database import Database, DatabaseError


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    database = Database(get_settings())
    try:
        database.check()
        with database.begin() as connection:
            # 확인용 임시 테이블은 트랜잭션 완료 후 사라진다.
            connection.execute(text("CREATE TEMP TABLE storyroute_connection_check "
                                    "(id integer PRIMARY KEY, note text NOT NULL) ON COMMIT DROP"))
            connection.execute(text("INSERT INTO storyroute_connection_check (id, note) VALUES (:id, :note)"),
                               {"id": 1, "note": "스토리루트 연결 확인"})
            connection.execute(text("UPDATE storyroute_connection_check SET note = :note WHERE id = :id"),
                               {"id": 1, "note": "스토리루트 읽기·쓰기 확인"})
            note = connection.execute(text("SELECT note FROM storyroute_connection_check WHERE id = :id"),
                                      {"id": 1}).scalar_one()
            if note != "스토리루트 읽기·쓰기 확인":
                raise DatabaseError("임시 데이터 확인에 실패했습니다.")
            details = connection.execute(text("SELECT current_database(), current_setting('server_version')")).one()
        with database.connect() as connection:
            remaining = connection.execute(text("SELECT to_regclass('pg_temp.storyroute_connection_check')")).scalar_one()
            if remaining is not None:
                raise DatabaseError("확인용 임시 테이블 정리에 실패했습니다.")
        print("PostgreSQL 실제 연결 성공")
        print(f"데이터베이스: {details[0]} · PostgreSQL 버전: {details[1]}")
        print("임시 테이블 생성·한국어 데이터 저장·수정·읽기 확인 통과")
        print("확인용 임시 테이블 정리 완료 · 사용자 테이블은 생성하지 않았습니다.")
        return 0
    except DatabaseError:
        print("DB 연결 확인 실패: 서버 .env 설정과 PostgreSQL 실행 상태를 확인해주세요.")
        return 1
    finally:
        database.dispose()


if __name__ == "__main__":
    sys.exit(main())
