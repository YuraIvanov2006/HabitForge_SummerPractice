"""
app/schemas/token.py
────────────────────
Pydantic schemas for JWT token responses.
"""
from pydantic import BaseModel


class Token(BaseModel):
    """Returned by POST /api/auth/login — contains both access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT payload (internal use)."""

    sub: str
    type: str


class TokenRefresh(BaseModel):
    """Payload for POST /api/auth/refresh."""

    refresh_token: str
