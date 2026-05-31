"""
app/core/dependencies.py
────────────────────────
FastAPI dependency functions used across multiple routers.
"""
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Database session ──────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session and close it when the request is done."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Current user ──────────────────────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate the Bearer JWT and return the authenticated User.

    Raises HTTP 401 if the token is missing, malformed, or expired.
    Raises HTTP 401 if the user referenced by the token no longer exists.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        token_type: str = payload.get("type", "")
        user_id: str | None = payload.get("sub")

        if token_type != "access" or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Lazy import to avoid circular dependency
    from app.crud.user import get_user_by_id  # noqa: PLC0415

    user = await get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception

    return user
