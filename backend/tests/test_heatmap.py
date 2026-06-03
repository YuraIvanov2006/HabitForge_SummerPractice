"""
backend/tests/test_heatmap.py
────────────────────────────
Tests for heatmap data contract and daily completion grid generation.
"""
from datetime import date, timedelta

import pytest
from httpx import AsyncClient

from app.utils.visuals import build_heatmap_grid


async def _get_auth_headers(client: AsyncClient, email: str, username: str) -> dict:
    await client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "Password123!"},
    )
    res = await client.post(
        "/api/auth/login",
        data={"username": email, "password": "Password123!"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_heatmap_grid_covers_all_days() -> None:
    """Grid must contain exactly one entry per day in the 30-day window."""
    reference = date(2026, 6, 15)
    completed = [reference - timedelta(days=5), reference - timedelta(days=1)]
    grid = build_heatmap_grid(completed, reference_date=reference, days=30)

    assert len(grid) == 30
    dates = [entry["date"] for entry in grid]
    assert dates[0] == (reference - timedelta(days=29)).isoformat()
    assert dates[-1] == reference.isoformat()
    assert len(set(dates)) == 30


def test_heatmap_intensity_correlates_with_completions() -> None:
    """Days with completions should have higher intensity than empty days."""
    reference = date(2026, 6, 10)
    completed = [reference, reference, reference - timedelta(days=2)]
    grid = build_heatmap_grid(completed, reference_date=reference, days=7)

    by_date = {entry["date"]: entry["intensity"] for entry in grid}
    assert by_date[reference.isoformat()] == 2
    assert by_date[(reference - timedelta(days=2)).isoformat()] == 1
    assert by_date[(reference - timedelta(days=1)).isoformat()] == 0


@pytest.mark.asyncio
async def test_logs_exclude_incomplete_from_heatmap(client: AsyncClient) -> None:
    """Incomplete log rows must not contribute to heatmap intensity."""
    headers = await _get_auth_headers(client, "heat@example.com", "heat")
    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Meditate", "category": "sleep", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": "2026-06-01", "is_completed": True},
    )
    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": "2026-06-02", "is_completed": False},
    )

    logs_res = await client.get(f"/api/habits/{habit_id}/logs", headers=headers)
    completed_dates = [
        date.fromisoformat(log["execution_date"])
        for log in logs_res.json()
        if log["is_completed"]
    ]
    grid = build_heatmap_grid(
        completed_dates, reference_date=date(2026, 6, 2), days=30
    )
    by_date = {entry["date"]: entry["intensity"] for entry in grid}
    assert by_date["2026-06-01"] == 1
    assert by_date["2026-06-02"] == 0


@pytest.mark.asyncio
async def test_logs_upsert_no_duplicates(client: AsyncClient) -> None:
    """Toggling the same date must not create duplicate log rows."""
    headers = await _get_auth_headers(client, "upsert@example.com", "upsert")
    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Read", "category": "study", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    for completed in (True, False, True):
        await client.post(
            f"/api/habits/{habit_id}/logs",
            headers=headers,
            json={"execution_date": "2026-06-05", "is_completed": completed},
        )

    logs_res = await client.get(f"/api/habits/{habit_id}/logs", headers=headers)
    june5_logs = [
        log for log in logs_res.json() if log["execution_date"] == "2026-06-05"
    ]
    assert len(june5_logs) == 1
    assert june5_logs[0]["is_completed"] is True
