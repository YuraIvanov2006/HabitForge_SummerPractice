"""
backend/tests/test_auth.py
──────────────────────────
Unit and integration tests for authentication endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_user_success(client: AsyncClient) -> None:
    """Test successful user registration."""
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "tester123",
            "email": "test@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "tester123"
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "hashed_password" not in data  # Assert password hash is never leaked


async def test_register_duplicate_username(client: AsyncClient) -> None:
    """Test duplicate username registration returns a 409 conflict."""
    # First user
    await client.post(
        "/api/auth/register",
        json={
            "username": "tester123",
            "email": "test1@example.com",
            "password": "Password123!",
        },
    )
    # Second user with duplicate username
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "tester123",
            "email": "test2@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "This username is already taken."


async def test_register_duplicate_email(client: AsyncClient) -> None:
    """Test duplicate email registration returns a 409 conflict."""
    # First user
    await client.post(
        "/api/auth/register",
        json={
            "username": "tester1",
            "email": "duplicate@example.com",
            "password": "Password123!",
        },
    )
    # Second user with duplicate email
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "tester2",
            "email": "duplicate@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "An account with this email address already exists."


async def test_login_success(client: AsyncClient) -> None:
    """Test successful login with OAuth2PasswordRequestForm format (form-urlencoded)."""
    # Create user first
    await client.post(
        "/api/auth/register",
        json={
            "username": "tester",
            "email": "tester@example.com",
            "password": "Password123!",
        },
    )

    # Attempt login using email (submitted as 'username' per OAuth2 specifications)
    response = await client.post(
        "/api/auth/login",
        data={
            "username": "tester@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_invalid_credentials(client: AsyncClient) -> None:
    """Test login with incorrect password returns 401 Unauthorized."""
    # Create user
    await client.post(
        "/api/auth/register",
        json={
            "username": "tester",
            "email": "tester@example.com",
            "password": "Password123!",
        },
    )

    # Incorrect password
    response = await client.post(
        "/api/auth/login",
        data={
            "username": "tester@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."
