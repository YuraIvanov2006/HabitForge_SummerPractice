"""Initial schema: users, habits, habit_logs

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2025-06-01 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # ── habits ────────────────────────────────────────────────────────────────
    op.create_table(
        "habits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("frequency", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_habits_id"), "habits", ["id"], unique=False)
    op.create_index(op.f("ix_habits_user_id"), "habits", ["user_id"], unique=False)

    # ── habit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "habit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("habit_id", sa.Integer(), nullable=False),
        sa.Column("execution_date", sa.Date(), nullable=False),
        sa.Column("is_completed", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["habit_id"], ["habits.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("habit_id", "execution_date", name="uq_habit_log_date"),
    )
    op.create_index(op.f("ix_habit_logs_id"), "habit_logs", ["id"], unique=False)
    op.create_index(
        op.f("ix_habit_logs_habit_id"), "habit_logs", ["habit_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_habit_logs_habit_id"), table_name="habit_logs")
    op.drop_index(op.f("ix_habit_logs_id"), table_name="habit_logs")
    op.drop_table("habit_logs")

    op.drop_index(op.f("ix_habits_user_id"), table_name="habits")
    op.drop_index(op.f("ix_habits_id"), table_name="habits")
    op.drop_table("habits")

    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
