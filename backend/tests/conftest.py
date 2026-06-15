"""
backend/tests/conftest.py
─────────────────────────
Configuration and fixtures for backend integration testing.
Uses an in-memory SQLite database via aiosqlite for speed and isolation.
"""
import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.dependencies import get_db
from app.core.state import set_current_date
from app.db.base import Base
from app.main import app
# Import models to ensure they are registered with Base.metadata
from app.models.habit import Habit  # noqa: F401
from app.models.habit_log import HabitLog  # noqa: F401
from app.models.user import User  # noqa: F401

# ── SQLite Database Setup ─────────────────────────────────────────────────────
# We use aiosqlite in-memory database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database and session for each test case."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide a test client that overrides get_db dependency to use the test session."""
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_rate_limits() -> None:
    """
    Reset slowapi in-memory rate limit storage before each test.

    Without this, all tests share the same 127.0.0.1 IP in the ASGI test client.
    Since the 10/minute limit for auth endpoints is shared across the in-memory
    limiter storage, tests beyond the 10th call would receive HTTP 429 errors.

    slowapi uses the `limits` library internally; clearing its storage ensures
    each test function starts with a clean rate-limit counter.
    """
    from app.middleware.rate_limit import limiter

    # The storage backend is accessible via limiter._limiter.storage
    # Calling .reset() clears all stored counters.
    try:
        limiter._limiter.storage.reset()
    except Exception:
        pass  # If storage doesn't support reset, tests still run (just may rate-limit)
    yield
    try:
        limiter._limiter.storage.reset()
    except Exception:
        pass


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def reset_date_override() -> None:
    set_current_date(None)
    yield
    set_current_date(None)
