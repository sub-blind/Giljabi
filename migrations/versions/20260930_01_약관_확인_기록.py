"""기존 계정의 과거 확인을 추정하지 않고 새 로그인 확인만 기록한다."""

from alembic import op
import sqlalchemy as sa

revision = "20260930_01"
down_revision = "20260918_01"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("policy_version", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("policy_confirmed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("age_confirmed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("users", "age_confirmed_at")
    op.drop_column("users", "policy_confirmed_at")
    op.drop_column("users", "policy_version")
