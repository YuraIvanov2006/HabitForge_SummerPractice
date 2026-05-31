"""
app/db/session.py
─────────────────
Async SQLAlchemy engine and session factory.
Use the ``get_db`` dependency (app/core/dependencies.py) to obtain a session
inside FastAPI endpoints; use ``AsyncSessionLocal`` directly only when you
need a session outside the request lifecycle (e.g. startup events).
"""
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=not settings.is_production,  # Log SQL in development
    future=True,
    pool_pre_ping=True,  # Detect stale connections
    pool_size=10,
    max_overflow=20,
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)
