"""Tests for the ONNX MiniLM-L6-v2 embedding wrapper.

The ONNXMiniLM_L6_V2 function is mocked so tests run without downloading
the model or requiring chromadb at test time. The wrapper logic is tested
independently of the underlying model.
"""
import pytest
from unittest.mock import MagicMock, patch


EMBEDDING_DIM = 384  # MiniLM-L6-v2 output dimension


def _make_mock_ef(texts: list[str]) -> MagicMock:
    """Return a mock embedding function that emits predictable vectors."""
    mock = MagicMock()
    mock.return_value = [[float(i) / 100] * EMBEDDING_DIM for i in range(len(texts))]
    return mock


def test_embed_texts_returns_list_of_vectors():
    texts = ["Hello world", "ADX Bank"]
    mock_ef = _make_mock_ef(texts)

    with patch("app.services.ai.rag.embedder.ONNXMiniLM_L6_V2", return_value=mock_ef), \
         patch("app.services.ai.rag.embedder._ef", None):
        from app.services.ai.rag import embedder
        embedder._ef = None  # reset singleton between tests

        result = embedder.embed_texts(texts)

    assert isinstance(result, list)
    assert len(result) == 2


def test_embed_texts_correct_dimensions():
    texts = ["one", "two", "three"]
    mock_ef = _make_mock_ef(texts)

    with patch("app.services.ai.rag.embedder.ONNXMiniLM_L6_V2", return_value=mock_ef), \
         patch("app.services.ai.rag.embedder._ef", None):
        from app.services.ai.rag import embedder
        embedder._ef = None

        result = embedder.embed_texts(texts)

    assert len(result) == 3
    for vec in result:
        assert len(vec) == EMBEDDING_DIM


def test_embed_query_returns_single_vector():
    mock_ef = _make_mock_ef(["query text"])

    with patch("app.services.ai.rag.embedder.ONNXMiniLM_L6_V2", return_value=mock_ef), \
         patch("app.services.ai.rag.embedder._ef", None):
        from app.services.ai.rag import embedder
        embedder._ef = None

        result = embedder.embed_query("query text")

    assert isinstance(result, list)
    assert len(result) == EMBEDDING_DIM


def test_embed_query_is_single_not_nested():
    """embed_query must return a flat list, not a list-of-lists."""
    mock_ef = _make_mock_ef(["test"])

    with patch("app.services.ai.rag.embedder.ONNXMiniLM_L6_V2", return_value=mock_ef), \
         patch("app.services.ai.rag.embedder._ef", None):
        from app.services.ai.rag import embedder
        embedder._ef = None

        result = embedder.embed_query("test")

    assert not isinstance(result[0], list), "embed_query must return a flat vector"


def test_singleton_created_once():
    """The embedding function object should be instantiated only once."""
    call_count = 0

    class MockEF:
        def __init__(self):
            nonlocal call_count
            call_count += 1

        def __call__(self, texts):
            return [[0.1] * EMBEDDING_DIM for _ in texts]

    with patch("app.services.ai.rag.embedder.ONNXMiniLM_L6_V2", MockEF), \
         patch("app.services.ai.rag.embedder._ef", None):
        from app.services.ai.rag import embedder
        embedder._ef = None

        embedder.embed_texts(["a"])
        embedder.embed_texts(["b"])
        embedder.embed_query("c")

    assert call_count == 1
