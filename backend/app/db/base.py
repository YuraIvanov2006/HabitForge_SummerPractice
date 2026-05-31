"""
app/db/base.py
──────────────
Declarative base class shared by all SQLAlchemy models.
Import this file (not sqlalchemy.orm.DeclarativeBase directly) everywhere.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Project-wide SQLAlchemy declarative base."""
    pass
