"""
app/services/habit_service.py
─────────────────────────────
Habit ownership and authorization helpers.
"""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.habit import get_habit_by_id
from app.models.habit import Habit
from app.models.user import User


async def get_own_habit(
    habit_id: int,
    db: AsyncSession,
    current_user: User,
) -> Habit:
    """
    Fetch a habit by *habit_id* and assert it belongs to *current_user*.

    Raises:
        404 if the habit does not exist.
        403 if the habit belongs to a different user.
    """
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
