"""Tests for the /health endpoint."""
import pytest


@pytest.mark.anyio
async def test_health_returns_200(client):
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_health_response_shape(client):
    response = await client.get("/health")
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"
    assert body["data"]["service"] == "banking-platform"


@pytest.mark.anyio
async def test_health_has_request_id(client):
    response = await client.get("/health")
    body = response.json()
    assert "request_id" in body
