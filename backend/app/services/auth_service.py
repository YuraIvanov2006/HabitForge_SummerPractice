"""
app/services/auth_service.py
────────────────────────────
Registration and authentication business logic.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import create_user, get_user_by_email, get_user_by_username
from app.models.user import User
from app.schemas.user import UserCreate


async def register_user(db: AsyncSession, payload: UserCreate) -> User:
    """
    Create a new user after validating uniqueness constraints.

    Raises:
        HTTPException 409 if email or username is already taken.
    """
    if await get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )
    if await get_user_by_username(db, payload.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )
    return await create_user(db, payload)
