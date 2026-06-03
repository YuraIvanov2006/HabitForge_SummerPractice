"""
app/schemas/habit.py
────────────────────
Pydantic schemas for Habit and HabitLog resources.
"""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── Habit schemas ─────────────────────────────────────────────────────────────

FrequencyType = Literal["daily", "weekly"]
CategoryType = Literal["study", "sport", "sleep", "nutrition", "other"]


class HabitCreate(BaseModel):
    """Payload for POST /api/habits/."""

    title: str = Field(..., min_length=1, max_length=128, examples=["Morning Run"])
    description: str | None = Field(
        None, max_length=500, examples=["Run 5 km every morning before work."]
    )
    frequency: FrequencyType = Field("daily", examples=["daily"])
    category: CategoryType = Field("other", examples=["other"])


class HabitUpdate(BaseModel):
    """Payload for PUT /api/habits/{habit_id}. All fields are optional."""

    title: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = Field(None, max_length=500)
    frequency: FrequencyType | None = None
    category: CategoryType | None = None


class HabitRead(BaseModel):
    """Habit representation returned by the API."""

    model_config = {"from_attributes": True}

    id: int
    user_id: int
    title: str
    description: str | None
    frequency: str
    category: str
    created_at: datetime


# ── HabitLog schemas ──────────────────────────────────────────────────────────


class HabitLogCreate(BaseModel):
    """Payload for POST /api/habits/{habit_id}/logs."""

    execution_date: date = Field(..., examples=["2025-06-01"])
    is_completed: bool = Field(True, examples=[True])


class HabitLogRead(BaseModel):
    """HabitLog representation returned by the API."""

    model_config = {"from_attributes": True}

    id: int
    habit_id: int
    execution_date: date
    is_completed: bool
