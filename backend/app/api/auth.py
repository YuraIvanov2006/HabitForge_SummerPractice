"""
app/api/auth.py
───────────────
Authentication endpoints:
  POST /api/auth/register  – Create a new account
  POST /api/auth/login     – Obtain JWT access + refresh tokens
  POST /api/auth/refresh   – Exchange refresh token for new access token
  POST /api/auth/logout    – Stateless logout (client clears tokens)

Rate limiting: 10 requests/minute per IP on login and register to prevent brute-force.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.crud.user import authenticate_user, get_user_by_id
from app.middleware.rate_limit import limiter
from app.schemas.token import Token, TokenRefresh
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import register_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
@limiter.limit("10/minute")
async def register(
    request: Request,
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """
    Create a new HabitForge account.

    - **username**: 3–64 alphanumeric characters, underscores, or hyphens.
    - **email**: Must be a valid e-mail address.
    - **password**: 8–128 characters (any printable characters).

    Returns the newly created user (no password exposed).

    **Rate limited**: 10 requests/minute per IP address.
    """
    user = await register_user(db, payload)
    return UserRead.model_validate(user)


@router.post(
    "/login",
    response_model=Token,
    summary="Log in and receive JWT access + refresh tokens",
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """
    Authenticate with **email** (passed as ``username`` field per OAuth2 spec)
    and **password** to receive a JWT Bearer token pair.

    - ``access_token``: Short-lived (default 30 min). Use as ``Authorization: Bearer <token>``.
    - ``refresh_token``: Long-lived (default 7 days). Store and use to obtain new access tokens.

    **Rate limited**: 10 requests/minute per IP address.
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post(
    "/refresh",
    response_model=Token,
    summary="Exchange a refresh token for a new access token",
)
async def refresh_token(
    payload: TokenRefresh,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """
    Exchange a valid **refresh token** for a fresh **access + refresh token pair**.

    The refresh token must:
    - Be a valid JWT signed with the server secret.
    - Have ``type == "refresh"`` in its payload.
    - Not be expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        data = decode_token(payload.refresh_token)
        token_type: str = data.get("type", "")
        user_id: str | None = data.get("sub")

        if token_type != "refresh" or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception

    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    return Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out (stateless — client must discard tokens)",
)
async def logout() -> dict:
    """
    Stateless logout endpoint.

    Returns HTTP 200 as a confirmation signal. The client is responsible for
    discarding both ``access_token`` and ``refresh_token`` from local storage.

    **Note**: Because this is stateless (no server-side token blacklist), the
    refresh token technically remains valid on the server until its natural
    expiry (7 days). This is an accepted trade-off for simplicity.
    """
    return {"message": "Successfully logged out. Please discard your tokens."}
