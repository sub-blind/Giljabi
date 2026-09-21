"""서버 환경 설정을 사용하는 PostgreSQL 마이그레이션 실행 환경."""

from alembic import context
from alembic.util import CommandError

from app.config import get_settings
from app.database import Database, DatabaseError
from app.models import Base


def run_migrations():
    supplied = context.config.attributes.get("connection")
    if context.is_offline_mode():
        # 오프라인 SQL 생성에는 실제 인증정보와 DB 연결이 필요하지 않다.
        context.configure(dialect_name="postgresql", target_metadata=Base.metadata,
                          literal_binds=True, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()
    elif supplied is not None:
        context.configure(connection=supplied, target_metadata=Base.metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()
    else:
        database = Database(get_settings())
        try:
            with database.connect() as connection:
                context.configure(connection=connection, target_metadata=Base.metadata, compare_type=True)
                with context.begin_transaction():
                    context.run_migrations()
        except DatabaseError:
            raise CommandError("DB 설정·실행 상태를 확인해주세요. 마이그레이션을 완료하지 못했습니다.") from None
        finally:
            database.dispose()


run_migrations()
