"""
app/models/habit.py
───────────────────
SQLAlchemy ORM model for the Habit entity.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    frequency: Mapped[str] = mapped_column(
        String(16), nullable=False, default="daily"
    )  # 'daily' | 'weekly'
    category: Mapped[str] = mapped_column(
        String(32), nullable=False, default="other"
    )  # 'study' | 'sport' | 'sleep' | 'nutrition' | 'other'
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    owner: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="habits",
    )
    logs: Mapped[list["HabitLog"]] = relationship(  # noqa: F821
        "HabitLog",
        back_populates="habit",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Habit id={self.id} title={self.title!r} user_id={self.user_id}>"
