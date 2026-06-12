"""
Embedding engine — singleton wrapper around ChromaDB's built-in ONNX MiniLM-L6-v2.

Uses chromadb.utils.embedding_functions.ONNXMiniLM_L6_V2 which bundles the model
weights and runs inference via onnxruntime (~50MB vs ~2GB for sentence-transformers).
The function instance is created once on first use (lazy) and reused thereafter.
"""
from __future__ import annotations

import logging

from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

logger = logging.getLogger(__name__)

_ef: ONNXMiniLM_L6_V2 | None = None


def _get_ef() -> ONNXMiniLM_L6_V2:
    """Return the singleton embedding function, creating it on first call."""
    global _ef
    if _ef is None:
        logger.info("Initialising ONNX MiniLM-L6-v2 embedding function")
        _ef = ONNXMiniLM_L6_V2()
        logger.info("ONNX embedding function ready")
    return _ef


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Encode a list of strings and return their embedding vectors."""
    ef = _get_ef()
    return ef(texts)


def embed_query(text: str) -> list[float]:
    """Encode a single query string."""
    return embed_texts([text])[0]
