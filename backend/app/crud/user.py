"""
app/crud/user.py
────────────────
Database interaction logic for the User model.
"""
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Return the User with the given *user_id*, or None."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Return the User with the given *email*, or None."""
    result = await db.execute(
        select(User).where(User.email == email.lower())
    )
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    """Return the User with the given *username*, or None."""
    result = await db.execute(
        select(User).where(User.username == username)
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    """
    Hash the password and persist a new User.

    Callers must check for duplicate email/username *before* calling this.
    """
    user = User(
        username=payload.username,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession, username_or_email: str, password: str
) -> User | None:
    """
    Verify username/email + plain-text password against the stored bcrypt hash.

    Returns the User on success, None on failure.
    """
    # Шукаємо користувача, у якого або email, або username збігається із введеним значенням
    result = await db.execute(
        select(User).where(
            or_(
                User.email == username_or_email.lower(),
                User.username == username_or_email
            )
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user