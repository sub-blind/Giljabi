"""계정 코스 방문 기록 초기 테이블

변경 식별자: 20260918_01
이전 식별자:
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20260918_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # 초기 스키마 생성·정리 순서
    op.create_table('users',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('provider', sa.String(length=20), nullable=False),
    sa.Column('provider_user_id', sa.String(length=100), nullable=False),
    sa.Column('nickname', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("provider = 'kakao'", name=op.f('ck_users_provider')),
    sa.CheckConstraint('length(btrim(provider_user_id)) > 0', name=op.f('ck_users_provider_user_id')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    sa.UniqueConstraint('provider', 'provider_user_id', name='uq_users_provider_identity')
    )
    op.create_table('auth_sessions',
    sa.Column('id', sa.String(length=64), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('token_hash', sa.CHAR(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("token_hash ~ '^[0-9a-f]{64}$'", name=op.f('ck_auth_sessions_token_hash')),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_auth_sessions_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_auth_sessions'))
    )
    op.create_index('ix_auth_sessions_expires_at', 'auth_sessions', ['expires_at'], unique=False)
    op.create_index('ix_auth_sessions_user_id', 'auth_sessions', ['user_id'], unique=False)
    op.create_table('courses',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=80), nullable=False),
    sa.Column('intent', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('version', sa.Integer(), server_default=sa.text('1'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("jsonb_typeof(intent) = 'object'", name=op.f('ck_courses_intent_object')),
    sa.CheckConstraint("length(btrim(title, E' \\t\\n\\r')) > 0", name=op.f('ck_courses_title')),
    sa.CheckConstraint('version > 0', name=op.f('ck_courses_version')),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_courses_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_courses'))
    )
    op.create_index('ix_courses_user_updated', 'courses', ['user_id', sa.literal_column('updated_at DESC')], unique=False)
    op.create_table('course_places',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('course_id', sa.Uuid(), nullable=False),
    sa.Column('source_service', sa.String(length=40), server_default=sa.text("'KorService2'"), nullable=False),
    sa.Column('content_id', sa.String(length=30), nullable=False),
    sa.Column('content_type_id', sa.String(length=10), nullable=False),
    sa.Column('position', sa.SmallInteger(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("content_type_id IN ('12', '14', '39')", name=op.f('ck_course_places_content_type_id')),
    sa.CheckConstraint("source_service = 'KorService2'", name=op.f('ck_course_places_source_service')),
    sa.CheckConstraint('length(btrim(content_id)) > 0', name=op.f('ck_course_places_content_id')),
    sa.CheckConstraint('position BETWEEN 1 AND 3', name=op.f('ck_course_places_position')),
    sa.ForeignKeyConstraint(['course_id'], ['courses.id'], name=op.f('fk_course_places_course_id_courses'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_course_places')),
    sa.UniqueConstraint('course_id', 'position', deferrable=True, initially='IMMEDIATE', name='uq_course_places_position'),
    sa.UniqueConstraint('course_id', 'source_service', 'content_id', name='uq_course_places_identity')
    )
    op.create_table('place_records',
    sa.Column('course_place_id', sa.Uuid(), nullable=False),
    sa.Column('visited_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('memo', sa.String(length=500), server_default=sa.text("''"), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['course_place_id'], ['course_places.id'], name=op.f('fk_place_records_course_place_id_course_places'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('course_place_id', name=op.f('pk_place_records'))
    )



def downgrade():
    # 초기 스키마 생성·정리 순서
    op.drop_table('place_records')
    op.drop_table('course_places')
    op.drop_index('ix_courses_user_updated', table_name='courses')
    op.drop_table('courses')
    op.drop_index('ix_auth_sessions_user_id', table_name='auth_sessions')
    op.drop_index('ix_auth_sessions_expires_at', table_name='auth_sessions')
    op.drop_table('auth_sessions')
    op.drop_table('users')
