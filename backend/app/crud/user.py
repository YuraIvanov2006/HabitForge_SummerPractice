"""
app/crud/user.py
────────────────
Database interaction logic for the User model.
"""
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


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


async def update_user(db: AsyncSession, user: User, payload: UserUpdate) -> User:
    """
    Update user's username and/or email.

    Callers must verify uniqueness before calling this function.
    Only fields explicitly set in *payload* are updated.
    """
    if payload.username is not None:
        user.username = payload.username
    if payload.email is not None:
        user.email = payload.email.lower()

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def change_password(
    db: AsyncSession,
    user: User,
    old_password: str,
    new_password: str,
) -> User:
    """
    Verify *old_password* against the stored hash, then update to *new_password*.

    Returns the updated User on success.
    Raises ValueError if old_password does not match.
    """
    if not verify_password(old_password, user.hashed_password):
        raise ValueError("Current password is incorrect.")

    user.hashed_password = hash_password(new_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    """
    Permanently delete the user and all their associated data.

    Cascade deletes on Habit → HabitLog are handled by the database FK constraints.
    """
    await db.delete(user)
    await db.commit()