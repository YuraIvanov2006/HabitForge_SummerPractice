"""
backend/tests/test_habits.py
────────────────────────────
Unit and integration tests for Habit and HabitLog management:
  - POST /api/habits/
  - GET /api/habits/
  - PUT /api/habits/{id}
  - DELETE /api/habits/{id}
  - POST /api/habits/{id}/logs
  - GET /api/habits/{id}/logs
"""
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


async def test_create_habit_success(client: AsyncClient) -> None:
    """Test successful creation of a habit with category and frequency."""
    headers = await _get_auth_headers(client, "user1@example.com", "user1")
    response = await client.post(
        "/api/habits/",
        headers=headers,
        json={
            "title": "Study Python",
            "description": "Spend 1 hour writing code",
            "frequency": "daily",
            "category": "study",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Study Python"
    assert data["description"] == "Spend 1 hour writing code"
    assert data["frequency"] == "daily"
    assert data["category"] == "study"
    assert "id" in data


async def test_list_habits(client: AsyncClient) -> None:
    """Test listing user's habits."""
    headers = await _get_auth_headers(client, "user2@example.com", "user2")
    # Create two habits
    await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Habit 1", "category": "sport", "frequency": "daily"},
    )
    await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Habit 2", "category": "sleep", "frequency": "weekly"},
    )

    response = await client.get("/api/habits/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    titles = [h["title"] for h in data]
    assert "Habit 1" in titles
    assert "Habit 2" in titles


async def test_update_habit(client: AsyncClient) -> None:
    """Test updating an existing habit."""
    headers = await _get_auth_headers(client, "user3@example.com", "user3")
    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Original Title", "category": "nutrition", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    # Update title and category
    response = await client.put(
        f"/api/habits/{habit_id}",
        headers=headers,
        json={"title": "Updated Title", "category": "study"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["category"] == "study"


async def test_delete_habit(client: AsyncClient) -> None:
    """Test deleting a habit."""
    headers = await _get_auth_headers(client, "user4@example.com", "user4")
    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Delete Me", "category": "other", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    response = await client.delete(f"/api/habits/{habit_id}", headers=headers)
    assert response.status_code == 204

    # Verify listing is empty
    list_res = await client.get("/api/habits/", headers=headers)
    assert len(list_res.json()) == 0


async def test_upsert_habit_logs(client: AsyncClient) -> None:
    """Test creating and toggling a habit completion log entry."""
    headers = await _get_auth_headers(client, "user5@example.com", "user5")
    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Daily Run", "category": "sport", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    # Log completion for a date
    response = await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={
            "execution_date": "2026-06-01",
            "is_completed": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["execution_date"] == "2026-06-01"
    assert data["is_completed"] is True

    # Toggle completion status (uncheck habit)
    toggle_res = await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={
            "execution_date": "2026-06-01",
            "is_completed": False,
        },
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is False


async def test_habit_logs_list(client: AsyncClient) -> None:
    """Test getting log entries for a habit."""
    headers = await _get_auth_headers(client, "user6@example.com", "user6")
    res = await client.post(
        "/api/habits/",
        headers=headers,
        json={"title": "Yoga", "category": "sport", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    # Log two completions
    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": "2026-06-01", "is_completed": True},
    )
    await client.post(
        f"/api/habits/{habit_id}/logs",
        headers=headers,
        json={"execution_date": "2026-06-02", "is_completed": True},
    )

    response = await client.get(f"/api/habits/{habit_id}/logs", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    dates = [log["execution_date"] for log in data]
    assert "2026-06-01" in dates
    assert "2026-06-02" in dates


async def test_unauthorized_habit_access(client: AsyncClient) -> None:
    """Test accessing another user's habit returns 403 Forbidden."""
    headers1 = await _get_auth_headers(client, "alice@example.com", "alice")
    headers2 = await _get_auth_headers(client, "bob@example.com", "bob")

    # Alice creates a habit
    res = await client.post(
        "/api/habits/",
        headers=headers1,
        json={"title": "Alice's Secret", "category": "other", "frequency": "daily"},
    )
    habit_id = res.json()["id"]

    # Bob attempts to update Alice's habit
    response = await client.put(
        f"/api/habits/{habit_id}",
        headers=headers2,
        json={"title": "Bob's Hacked Title"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "You do not have permission to access this habit."
