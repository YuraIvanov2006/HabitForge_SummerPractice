"""
app/api/users.py
────────────────
User profile endpoints:
  GET /api/users/me  – Return the currently authenticated user
"""
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get the currently authenticated user's profile",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """
    Returns the profile of the user identified by the Bearer token.

    Requires a valid JWT access token.
    """
    return UserRead.model_validate(current_user)
