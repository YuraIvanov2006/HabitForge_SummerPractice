"""
app/api/habits.py
─────────────────
Habit + HabitLog endpoints (all require authentication):

  POST   /api/habits/                    – Create a new habit
  GET    /api/habits/                    – List current user's habits
  PUT    /api/habits/{habit_id}          – Update a habit
  DELETE /api/habits/{habit_id}          – Delete a habit
  POST   /api/habits/{habit_id}/logs     – Upsert a log entry (mark done/undone)
  GET    /api/habits/{habit_id}/logs     – List all log entries for a habit
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.crud.habit import (
    create_habit,
    delete_habit,
    get_habit_by_id,
    get_habits_by_user,
    get_logs_by_habit,
    update_habit,
    upsert_habit_log,
)
from app.models.user import User
from app.schemas.habit import (
    HabitCreate,
    HabitLogCreate,
    HabitLogRead,
    HabitRead,
    HabitUpdate,
)

router = APIRouter(prefix="/api/habits", tags=["Habits"])


# ── Helper ────────────────────────────────────────────────────────────────────

async def _get_own_habit(
    habit_id: int,
    db: AsyncSession,
    current_user: User,
) -> "Habit":  # noqa: F821
    """
    Fetch a habit by *habit_id* and assert it belongs to *current_user*.

    Raises:
        404 if the habit does not exist.
        403 if the habit belongs to a different user.
    """
    from app.models.habit import Habit  # local import to avoid circular

    habit = await get_habit_by_id(db, habit_id)
    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habit with id={habit_id} not found.",
        )
    if habit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this habit.",
        )
    return habit


# ── Habit endpoints ───────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=HabitRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new habit",
)
async def create_new_habit(
    payload: HabitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HabitRead:
    """Create a new tracking habit for the authenticated user."""
    habit = await create_habit(db, payload, current_user.id)
    return HabitRead.model_validate(habit)


@router.get(
    "/",
    response_model=list[HabitRead],
    summary="List all habits for the current user",
)
async def list_habits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[HabitRead]:
    """Return all habits belonging to the authenticated user."""
    habits = await get_habits_by_user(db, current_user.id)
    return [HabitRead.model_validate(h) for h in habits]


@router.put(
    "/{habit_id}",
    response_model=HabitRead,
    summary="Update a habit",
)
async def update_existing_habit(
    habit_id: int,
    payload: HabitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HabitRead:
    """
    Partially update a habit's title, description, or frequency.

    Only the fields present in the request body are updated.
    """
    habit = await _get_own_habit(habit_id, db, current_user)
    updated = await update_habit(db, habit, payload)
    return HabitRead.model_validate(updated)


@router.delete(
    "/{habit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a habit",
)
async def delete_existing_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Permanently delete a habit and all its associated log entries.

    Returns 204 No Content on success.
    """
    habit = await _get_own_habit(habit_id, db, current_user)
    await delete_habit(db, habit)


# ── HabitLog endpoints ────────────────────────────────────────────────────────

@router.post(
    "/{habit_id}/logs",
    response_model=HabitLogRead,
    status_code=status.HTTP_200_OK,
    summary="Create or update a habit log entry",
)
async def upsert_log(
    habit_id: int,
    payload: HabitLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HabitLogRead:
    """
    Mark a habit as done (or undone) for a specific date.

    - If no log exists for *execution_date*, it is created.
    - If a log already exists for *execution_date*, its ``is_completed``
      flag is updated (upsert semantics).

    This is the primary endpoint used by the frontend calendar/heatmap.
    """
    await _get_own_habit(habit_id, db, current_user)
    log = await upsert_habit_log(db, habit_id, payload)
    return HabitLogRead.model_validate(log)


@router.get(
    "/{habit_id}/logs",
    response_model=list[HabitLogRead],
    summary="Get all log entries for a habit",
)
async def get_habit_logs(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[HabitLogRead]:
    """
    Return the full execution history for a habit, ordered by date ascending.

    The response is structured to feed directly into a heatmap component —
    each entry contains ``execution_date`` and ``is_completed``.
    """
    await _get_own_habit(habit_id, db, current_user)
    logs = await get_logs_by_habit(db, habit_id)
    return [HabitLogRead.model_validate(log) for log in logs]
