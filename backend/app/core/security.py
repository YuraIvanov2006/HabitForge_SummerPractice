"""
app/core/security.py
────────────────────
Password hashing and JWT token utilities using native bcrypt.
"""
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from app.core.config import settings

# ── Password helpers (Native Bcrypt) ──────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Return a bcrypt-hashed version of *plain_password*."""
    # Перетворюємо пароль у байти
    password_bytes = plain_password.encode('utf-8')
    # Генеруємо сіль та хешуємо
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Повертаємо як рядок для збереження в БД
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches *hashed_password*."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _create_token(subject: Any, expires_delta: timedelta, token_type: str) -> str:
    """Internal helper – create a signed JWT."""
    now = datetime.now(tz=timezone.utc)
    expire = now + expires_delta
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: Any) -> str:
    """Create a short-lived JWT access token."""
    delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(subject, delta, token_type="access")


def create_refresh_token(subject: Any) -> str:
    """Create a longer-lived JWT refresh token."""
    delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(subject, delta, token_type="refresh")


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])