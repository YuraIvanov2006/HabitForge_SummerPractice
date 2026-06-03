"""Add category to habits

Revision ID: 0002_add_habit_category
Revises: 0001_initial_schema
Create Date: 2026-06-03 14:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_add_habit_category"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add category column to habits table
    op.add_column(
        "habits",
        sa.Column("category", sa.String(length=32), nullable=False, server_default="other")
    )
    # Remove server default so it relies on the model defaults/schemas hereafter
    op.alter_column("habits", "category", server_default=None)


def downgrade() -> None:
    op.drop_column("habits", "category")
