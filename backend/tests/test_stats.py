"""
backend/tests/test_stats.py
───────────────────────────
Unit and integration tests for the analytics, gamification, and stats endpoints:
  - GET /api/stats/
"""
from datetime import date, timedelta
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(client: AsyncClient, email: str, username: str) -> dict:
    """Helper to register and login a user and return authorization headers."""
    await client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "Password123!",
        },
    )
    res = await client.post(
        "/api/auth/login",
        data={
            "username": email,
            "password": "Password123!",
        },
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_stats_empty_dashboard(client: AsyncClient) -> None:
    """Test statistics responses for a brand new user with no habits or logs."""
    headers = await _get_auth_headers(client, "newuser@example.com", "newuser")

    response = await client.get("/api/stats/", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total_xp"] == 0
    assert data["level"] == 1
    assert data["xp_progress"] == 0
    assert data["tree_stage"] == 0
    assert "Seed" in data["tree_stage_name"]
    assert data["streak_current"] == 0
    assert data["streak_longest"] == 0
    assert data["habits_count"] == 0
    assert data["completions_count"] == 0
    assert data["completion_rate"] == 0.0
    assert data["category_stats"]["study"] == 0
    assert data["weekly_report"]["this_week_completions"] == 0
    assert data["weekly_report"]["last_week_completions"] == 0
    assert data["weekly_report"]["growth_rate"] == 0.0


async def test_stats_xp_and_level_progression(client: AsyncClient) -> None:
    """Test XP and Level progression formulas after completing daily/weekly habits."""
    headers = await _get_auth_headers(client, "active@example.com", "active")

    # 1. Create a daily habit in 'sport' and a weekly habit in 'study'
    res_daily = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Workout", "category": "sport", "frequency": "daily"},
    )
    daily_id = res_daily.json()["id"]

    res_weekly = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Weekly Reading", "category": "study", "frequency": "weekly"},
    )
    weekly_id = res_weekly.json()["id"]

    # 2. Log 2 daily completions and 1 weekly completion
    # Daily completions (10 XP each = 20 XP)
    await client.post(
        f"/api/habits/{daily_id}/logs",
        headers=headers,
        json={"execution_date": str(date.today() - timedelta(days=2)), "is_completed": True},
    )
    # This forms a streak of 1 if we stop there, but let's log another date
    await client.post(
        f"/api/habits/{daily_id}/logs",
        headers=headers,
        json={"execution_date": str(date.today() - timedelta(days=1)), "is_completed": True},
    )

    # Weekly completion (30 XP each = 30 XP)
    await client.post(
        f"/api/habits/{weekly_id}/logs",
        headers=headers,
        json={"execution_date": str(date.today()), "is_completed": True},
    )

    # Since we completed the daily habit yesterday (date.today() - 1) and the day before, current streak is 2.
    # Streak bonus = max_current_streak * 10 = 20 XP
    # Total XP expected = (2 * 10) + (1 * 30) + (2 * 10) = 70 XP.
    response = await client.get("/api/stats/", headers=headers)
    data = response.json()
    assert data["completions_count"] == 3
    assert data["total_xp"] == 70
    assert data["level"] == 1
    assert data["xp_progress"] == 70
    assert data["category_stats"]["sport"] == 20  # 2 * 10
    assert data["category_stats"]["study"] == 30  # 1 * 30


async def test_stats_streaks_calculation(client: AsyncClient) -> None:
    """Test streak calculations (current streak, longest streak) under different log histories."""
    headers = await _get_auth_headers(client, "streak@example.com", "streak")

    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Code", "category": "study", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    # Create a 3-day streak ending yesterday
    # e.g., today-3, today-2, today-1
    t = date.today()
    dates = [t - timedelta(days=3), t - timedelta(days=2), t - timedelta(days=1)]

    for d in dates:
        await client.post(
            f"/api/habits/{habit_id}/logs",
            headers=headers,
            json={"execution_date": str(d), "is_completed": True},
        )

    # Check stats. Active daily streak ending yesterday is 3.
    # Longest streak should be 3.
    res_stats = await client.get("/api/stats/", headers=headers)
    data = res_stats.json()
    assert data["streak_current"] == 3
    assert data["streak_longest"] == 3

    # Add a broken gap: complete today (makes current streak 4, longest 4)
    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": str(t), "is_completed": True},
    )

    res_stats = await client.get("/api/stats/", headers=headers)
    assert res_stats.json()["streak_current"] == 4
    assert res_stats.json()["streak_longest"] == 4
