"""
app/crud/habit.py
─────────────────
Database interaction logic for Habit and HabitLog models.
"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.schemas.habit import HabitCreate, HabitLogCreate, HabitUpdate


# ── Habit CRUD ────────────────────────────────────────────────────────────────

async def create_habit(
    db: AsyncSession, payload: HabitCreate, user_id: int
) -> Habit:
    """Create a new Habit owned by *user_id*."""
    habit = Habit(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        frequency=payload.frequency,
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


async def get_habits_by_user(db: AsyncSession, user_id: int) -> list[Habit]:
    """Return all Habits belonging to *user_id*, ordered newest-first."""
    result = await db.execute(
        select(Habit)
        .where(Habit.user_id == user_id)
        .order_by(Habit.created_at.desc())
    )
    return list(result.scalars().all())


async def get_habit_by_id(db: AsyncSession, habit_id: int) -> Habit | None:
    """Return the Habit with *habit_id*, or None."""
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    return result.scalar_one_or_none()


async def update_habit(
    db: AsyncSession, habit: Habit, payload: HabitUpdate
) -> Habit:
    """Apply partial updates from *payload* to *habit* and persist."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)
    await db.commit()
    await db.refresh(habit)
    return habit


async def delete_habit(db: AsyncSession, habit: Habit) -> None:
    """Delete *habit* and all its cascade-related logs."""
    await db.delete(habit)
    await db.commit()


# ── HabitLog CRUD ─────────────────────────────────────────────────────────────

async def get_logs_by_habit(
    db: AsyncSession, habit_id: int
) -> list[HabitLog]:
    """Return all HabitLogs for *habit_id*, ordered by execution_date ascending."""
    result = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id)
        .order_by(HabitLog.execution_date.asc())
    )
    return list(result.scalars().all())


async def get_log_by_date(
    db: AsyncSession, habit_id: int, execution_date: date
) -> HabitLog | None:
    """Return the HabitLog for *habit_id* on *execution_date*, or None."""
    result = await db.execute(
        select(HabitLog).where(
            HabitLog.habit_id == habit_id,
            HabitLog.execution_date == execution_date,
        )
    )
    return result.scalar_one_or_none()


async def upsert_habit_log(
    db: AsyncSession, habit_id: int, payload: HabitLogCreate
) -> HabitLog:
    """
    Create a HabitLog for *execution_date*, or update its ``is_completed``
    flag if a log already exists for that date (upsert semantics).
    """
    existing = await get_log_by_date(db, habit_id, payload.execution_date)
    if existing:
        existing.is_completed = payload.is_completed
        await db.commit()
        await db.refresh(existing)
        return existing

    log = HabitLog(
        habit_id=habit_id,
        execution_date=payload.execution_date,
        is_completed=payload.is_completed,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
