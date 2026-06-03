"""Pydantic schemas for utility endpoints."""

from datetime import date as date_type

from pydantic import BaseModel, Field


class DateOverrideRequest(BaseModel):
    """Set or clear the server-wide virtual current date."""

    date: date_type | None = Field(
        None,
        description="ISO date (YYYY-MM-DD). Pass null to clear the override.",
        examples=["2026-06-15"],
    )


class CurrentDateResponse(BaseModel):
    date: str = Field(..., description="Effective current date (YYYY-MM-DD)")
    is_overridden: bool = Field(
        ..., description="True when a virtual date override is active"
    )
