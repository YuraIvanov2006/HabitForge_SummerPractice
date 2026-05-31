"""
app/schemas/token.py
────────────────────
Pydantic schemas for JWT token responses.
"""
from pydantic import BaseModel


class Token(BaseModel):
    """Returned by POST /api/auth/login."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT payload (internal use)."""

    sub: str
    type: str
