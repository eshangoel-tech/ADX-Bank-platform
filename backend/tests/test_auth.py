"""Tests for auth registration and login endpoints."""
import pytest
from unittest.mock import AsyncMock, patch


VALID_REGISTER_PAYLOAD = {
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "securepassword123",
    "salary": 50000,
}


@pytest.mark.anyio
async def test_register_validates_short_password(client):
    """Password under 8 chars must return 422."""
    payload = {**VALID_REGISTER_PAYLOAD, "password": "short"}
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_register_validates_bad_email(client):
    """Invalid email must return 422."""
    payload = {**VALID_REGISTER_PAYLOAD, "email": "not-an-email"}
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_register_validates_missing_required_fields(client):
    """Missing required fields must return 422."""
    response = await client.post("/api/v1/auth/register", json={})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_register_success_with_mocked_service(client):
    """Valid payload with mocked AuthService returns 200."""
    with patch(
        "app.api.v1.core.auth_routes.AuthService"
    ) as MockService:
        mock_service = MockService.return_value
        mock_service.register_user = AsyncMock(return_value="user-id-abc123")

        response = await client.post(
            "/api/v1/auth/register", json=VALID_REGISTER_PAYLOAD
        )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["user_id"] == "user-id-abc123"
        assert body["data"]["status"] == "INACTIVE"


@pytest.mark.anyio
async def test_login_validates_missing_fields(client):
    """Login with empty body returns 422."""
    response = await client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_login_validates_short_identifier(client):
    """Empty identifier returns 422."""
    response = await client.post(
        "/api/v1/auth/login", json={"identifier": "", "password": "somepassword"}
    )
    assert response.status_code == 422
