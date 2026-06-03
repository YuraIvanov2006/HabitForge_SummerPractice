"""
backend/tests/test_util_date.py
───────────────────────────────
Tests for the virtual date override utility endpoints.
"""
from datetime import date

import pytest
from httpx import AsyncClient

from app.core.state import get_current_date, set_current_date

pytestmark = pytest.mark.asyncio


async def test_get_current_date_default(client: AsyncClient) -> None:
    response = await client.get("/api/util/date")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == date.today().isoformat()
    assert data["is_overridden"] is False


async def test_set_and_get_virtual_date(client: AsyncClient) -> None:
    response = await client.post(
        "/api/util/date",
        json={"date": "2026-06-15"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-06-15"
    assert data["is_overridden"] is True
    assert get_current_date() == date(2026, 6, 15)


async def test_clear_virtual_date(client: AsyncClient) -> None:
    await client.post("/api/util/date", json={"date": "2026-01-01"})
    response = await client.post("/api/util/date", json={"date": None})
    assert response.status_code == 200
    assert response.json()["is_overridden"] is False
    assert get_current_date() == date.today()


async def test_stats_respects_virtual_date(client: AsyncClient) -> None:
    """Streak calculations should use the overridden date."""
    await client.post(
        "/api/auth/register",
        json={
            "username": "dated",
            "email": "dated@example.com",
            "password": "Password123!",
        },
    )
    login = await client.post(
        "/api/auth/login",
        data={"username": "dated@example.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    habit = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Walk", "category": "sport", "frequency": "daily"},
    )
    habit_id = habit.json()["id"]

    await client.post(
        "/api/util/date",
        json={"date": "2026-06-10"},
    )
    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": "2026-06-09", "is_completed": True},
    )
    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": "2026-06-10", "is_completed": True},
    )

    stats = await client.get("/api/stats/", headers=headers)
    assert stats.json()["streak_current"] == 2

    set_current_date(None)
