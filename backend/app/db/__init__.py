"""
app/db/__init__.py

Re-export Base and engine so Alembic env.py can import from one place.
"""
from app.db.base import Base  # noqa: F401
from app.db.session import engine  # noqa: F401
