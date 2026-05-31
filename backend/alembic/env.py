"""
alembic/env.py
──────────────
Alembic environment configuration.

This file configures the migration context so that:
  - The SYNC_DATABASE_URL from .env is used for migrations
    (asyncpg cannot be used by Alembic directly).
  - All project models are imported so that autogenerate detects changes.
"""
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# ── Make sure the backend/ package root is on sys.path ───────────────────────
# This file lives at backend/alembic/env.py; backend/ is two levels up.
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# ── Load .env so that settings are available ─────────────────────────────────
from dotenv import load_dotenv  # noqa: E402

load_dotenv(backend_dir / ".env")

# ── Import settings + models (must happen after sys.path is set) ─────────────
from app.core.config import settings  # noqa: E402
from app.db.base import Base  # noqa: E402
import app.models  # noqa: E402, F401  – registers all models with Base.metadata

# ── Alembic Config object ─────────────────────────────────────────────────────
config = context.config

# Set the SQLAlchemy URL from our settings (sync driver required by Alembic)
config.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata object for 'autogenerate' support
target_metadata = Base.metadata


# ── Migration helpers ─────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
