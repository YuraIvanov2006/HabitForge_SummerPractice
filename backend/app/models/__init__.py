"""
app/models/__init__.py

Import all models here so that Alembic's autogenerate can detect them
when ``Base.metadata`` is inspected.
"""
from app.models.habit import Habit  # noqa: F401
from app.models.habit_log import HabitLog  # noqa: F401
from app.models.user import User  # noqa: F401
