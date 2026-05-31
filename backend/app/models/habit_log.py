"""
app/models/habit_log.py
───────────────────────
SQLAlchemy ORM model for daily/weekly habit execution tracking.
"""
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class HabitLog(Base):
    __tablename__ = "habit_logs"

    # Enforce that one habit can only have one log entry per date
    __table_args__ = (
        UniqueConstraint("habit_id", "execution_date", name="uq_habit_log_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    habit_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    execution_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    habit: Mapped["Habit"] = relationship(  # noqa: F821
        "Habit",
        back_populates="logs",
    )

    def __repr__(self) -> str:
        return (
            f"<HabitLog id={self.id} habit_id={self.habit_id} "
            f"date={self.execution_date} completed={self.is_completed}>"
        )
