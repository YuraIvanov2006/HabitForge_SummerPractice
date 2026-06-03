"""
app/api/auth.py
───────────────
Authentication endpoints:
  POST /api/auth/register  – Create a new account
  POST /api/auth/login     – Obtain a JWT access token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.crud.user import authenticate_user
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import register_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """
    Create a new HabitForge account.

    - **username**: 3–64 alphanumeric characters, underscores, or hyphens.
    - **email**: Must be a valid e-mail address.
    - **password**: 8–128 characters (any printable characters).

    Returns the newly created user (no password exposed).
    """
    user = await register_user(db, payload)
    return UserRead.model_validate(user)


@router.post(
    "/login",
    response_model=Token,
    summary="Log in and receive a JWT access token",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """
    Authenticate with **email** (passed as ``username`` field per OAuth2 spec)
    and **password** to receive a JWT Bearer token.

    The token must be included as ``Authorization: Bearer <token>`` in
    all protected requests.
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token)
