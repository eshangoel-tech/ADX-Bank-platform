"""Tests for call_llm fallback chain logic."""
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.messages import AIMessage

from app.services.ai.llm_utils import LLMCallResult, call_llm


def _mock_llm(response_text: str) -> MagicMock:
    """Return a mock LangChain chat model that returns a fixed response."""
    llm = MagicMock()
    msg = AIMessage(content=response_text)
    msg.response_metadata = {"token_usage": {"prompt_tokens": 10, "completion_tokens": 20}}
    llm.invoke.return_value = msg
    return llm


def test_call_llm_returns_llm_call_result():
    mock_llm = _mock_llm("Hello from AI")

    with patch("app.services.ai.llm_utils._build_llm", return_value=mock_llm), \
         patch("app.services.ai.llm_utils.AI_PROVIDER_PRIORITY", ["groq"]):
        result = call_llm("test_agent", "You are helpful.", "What time is it?")

    assert isinstance(result, LLMCallResult)


def test_call_llm_success_status():
    mock_llm = _mock_llm("Response text")

    with patch("app.services.ai.llm_utils._build_llm", return_value=mock_llm), \
         patch("app.services.ai.llm_utils.AI_PROVIDER_PRIORITY", ["groq"]):
        result = call_llm("agent", "system", "user")

    assert result.status == "SUCCESS"
    assert result.response_text == "Response text"
    assert result.provider_used == "groq"


def test_call_llm_captures_agent_name():
    mock_llm = _mock_llm("ok")

    with patch("app.services.ai.llm_utils._build_llm", return_value=mock_llm), \
         patch("app.services.ai.llm_utils.AI_PROVIDER_PRIORITY", ["groq"]):
        result = call_llm("bank_manager", "sys", "user msg")

    assert result.agent_name == "bank_manager"


def test_call_llm_falls_back_on_first_provider_failure():
    """If the first provider raises, the second provider should be used."""
    failing_llm = MagicMock()
    failing_llm.invoke.side_effect = RuntimeError("Provider quota exceeded")

    ok_llm = _mock_llm("Fallback response")

    def build_side_effect(provider: str, temperature: float):
        return failing_llm if provider == "groq" else ok_llm

    with patch("app.services.ai.llm_utils._build_llm", side_effect=build_side_effect), \
         patch("app.services.ai.llm_utils.AI_PROVIDER_PRIORITY", ["groq", "openai"]):
        result = call_llm("agent", "sys", "user")

    assert result.status == "SUCCESS"
    assert result.provider_used == "openai"
    assert result.response_text == "Fallback response"


def test_call_llm_fails_when_all_providers_fail():
    """LLMCallResult.status must be FAILED when every provider raises."""
    failing_llm = MagicMock()
    failing_llm.invoke.side_effect = RuntimeError("All down")

    with patch("app.services.ai.llm_utils._build_llm", return_value=failing_llm), \
         patch("app.services.ai.llm_utils.AI_PROVIDER_PRIORITY", ["groq", "openai"]):
        result = call_llm("agent", "sys", "user")

    assert result.status == "FAILED"
    assert result.error_msg is not None


def test_call_llm_records_latency():
    mock_llm = _mock_llm("fast")

    with patch("app.services.ai.llm_utils._build_llm", return_value=mock_llm), \
         patch("app.services.ai.llm_utils.AI_PROVIDER_PRIORITY", ["groq"]):
        result = call_llm("agent", "sys", "user")

    assert result.latency_ms >= 0
