"""
app/api/users.py
────────────────
User profile endpoints:
  GET    /api/users/me                  – Return the currently authenticated user
  PATCH  /api/users/me                  – Update username and/or email
  POST   /api/users/me/change-password  – Change the user's password
  DELETE /api/users/me                  – Permanently delete the account
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.crud.user import (
    change_password,
    delete_user,
    get_user_by_email,
    get_user_by_username,
    update_user,
)
from app.models.user import User
from app.schemas.user import PasswordChange, UserRead, UserUpdate

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


@router.patch(
    "/me",
    response_model=UserRead,
    summary="Update username and/or email",
)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """
    Update the authenticated user's **username** and/or **email**.

    - Only fields provided in the request body are updated (PATCH semantics).
    - Returns HTTP 409 if the new username or email is already taken by another account.
    """
    # Check username uniqueness
    if payload.username and payload.username != current_user.username:
        existing = await get_user_by_username(db, payload.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already taken.",
            )

    # Check email uniqueness
    if payload.email and payload.email.lower() != current_user.email:
        existing = await get_user_by_email(db, payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

    updated = await update_user(db, current_user, payload)
    return UserRead.model_validate(updated)


@router.post(
    "/me/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change the current user's password",
)
async def change_my_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Change the authenticated user's password.

    - **old_password**: Must match the current stored password.
    - **new_password**: Must be 8–128 characters.

    Returns HTTP 400 if the old password is incorrect.
    """
    try:
        await change_password(
            db,
            current_user,
            payload.old_password,
            payload.new_password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return {"message": "Password changed successfully."}


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete the current user's account",
)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Permanently delete the authenticated user's account and **all associated data**.

    This action is **irreversible**. Habits and their completion logs are
    cascade-deleted via the database foreign key constraints.
    """
    await delete_user(db, current_user)
