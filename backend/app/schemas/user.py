from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


class UserCreate(BaseModel):
    """Payload for POST /api/auth/register."""

    username: str = Field(
        ..., min_length=3, max_length=64, examples=["john_doe"]
    )
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(
        ...,
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        examples=["StrongPass1!"],
    )

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
        if len(v) < PASSWORD_MIN_LENGTH:
            raise ValueError(
                f"Password must be at least {PASSWORD_MIN_LENGTH} characters long."
            )
        if len(v) > PASSWORD_MAX_LENGTH:
            raise ValueError(
                f"Password must be at most {PASSWORD_MAX_LENGTH} characters long."
            )
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


class UserUpdate(BaseModel):
    """Payload for PATCH /api/users/me — all fields optional."""

    username: Optional[str] = Field(
        None, min_length=3, max_length=64, examples=["new_username"]
    )
    email: Optional[EmailStr] = Field(None, examples=["newemail@example.com"])

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not all(c.isalnum() or c in ("_", "-") for c in v):
            raise ValueError(
                "Username may only contain letters, digits, underscores, and hyphens."
            )
        return v


class PasswordChange(BaseModel):
    """Payload for POST /api/users/me/change-password."""

    old_password: str = Field(..., examples=["OldPass1!"])
    new_password: str = Field(
        ...,
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        examples=["NewStrongPass1!"],
    )

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < PASSWORD_MIN_LENGTH:
            raise ValueError(
                f"New password must be at least {PASSWORD_MIN_LENGTH} characters long."
            )
        if len(v) > PASSWORD_MAX_LENGTH:
            raise ValueError(
                f"New password must be at most {PASSWORD_MAX_LENGTH} characters long."
            )
        return v
