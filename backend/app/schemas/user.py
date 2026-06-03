from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, ValidationError

class UserCreate(BaseModel):
    """Payload for POST /api/auth/register."""

    username: str = Field(
        ..., min_length=3, max_length=64, examples=["john_doe"]
    )
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., min_length=8, examples=["StrongPass1!"])

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not all(c.isalnum() or c in ("_", "-") for c in v):
            raise ValueError(
                "Username may only contain letters, digits, underscores, and hyphens."
            )
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        # Optional: add more checks (uppercase, digit, special) if desired
        return v

class UserRead(BaseModel):
    """Safe user representation returned by the API (no password)."""

    model_config = {"from_attributes": True}

    id: int
    username: str
    email: EmailStr
    created_at: datetime

class UserLogin(BaseModel):
    """Payload for POST /api/auth/login (JSON body alternative)."""

    email: EmailStr
    password: str
