"""
Pytest configuration — env vars MUST be set before any app imports
because session.py raises ValueError at module level if DATABASE_URL is missing.
"""
import os

# Set required env vars before any app code is imported.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-minimum!")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """
    HTTP test client with:
    - initialize_vector_store patched out (avoids ChromaDB on startup)
    - get_db overridden with a mock AsyncSession
    """
    from app.main import app
    from app.repository.session import get_db

    mock_session = AsyncMock(spec=AsyncSession)

    async def mock_get_db():
        yield mock_session

    with patch("app.main.initialize_vector_store"):
        app.dependency_overrides[get_db] = mock_get_db
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
        app.dependency_overrides.clear()
