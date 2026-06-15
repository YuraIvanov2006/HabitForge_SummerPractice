"""
app/main.py
───────────
FastAPI application factory.

All routers are registered here. This is the entry-point used by Uvicorn:
    uvicorn app.main:app --reload
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import auth, habits, reports, stats, users, util
from app.core.config import settings
from app.middleware.rate_limit import limiter


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.
    Runs startup/shutdown logic without deprecated on_event decorators.
    """
    # Startup – nothing to do here; Alembic handles schema migrations.
    yield
    # Shutdown – dispose the async engine connection pool.
    from app.db.session import engine  # noqa: PLC0415
    await engine.dispose()


# ── App factory ───────────────────────────────────────────────────────────────

def create_application() -> FastAPI:
    application = FastAPI(
        title="HabitForge API",
        description=(
            "🔥 **HabitForge** — Personal Habit & Productivity Tracker.\n\n"
            "Build the habit. Forge the future.\n\n"
            "### Authentication\n"
            "Use `POST /api/auth/register` to create an account, then "
            "`POST /api/auth/login` to obtain a Bearer token pair (access + refresh). "
            "Click the 🔓 **Authorize** button and paste your access token.\n\n"
            "### Token Refresh\n"
            "When the access token expires, use `POST /api/auth/refresh` with your "
            "refresh token to obtain a new token pair without re-logging in."
        ),
        version="1.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Rate limiting ──────────────────────────────────────────────────────────
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    application.add_middleware(SlowAPIMiddleware)

    # ── CORS ──────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    application.include_router(auth.router)
    application.include_router(users.router)
    application.include_router(habits.router)
    application.include_router(stats.router)
    application.include_router(reports.router)
    application.include_router(util.router)

    return application


app: FastAPI = create_application()


# ── Health check ──────────────────────────────────────────────────────────────

@app.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    response_description="Service status",
)
async def health_check() -> dict:
    """
    Lightweight liveness probe.

    Returns ``{"status": "ok"}`` when the service is running.
    Suitable for use with Docker / Kubernetes health checks.
    """
    return {"status": "ok", "service": "HabitForge API", "version": app.version}
