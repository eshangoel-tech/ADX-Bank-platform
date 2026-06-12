"""Tests for the Router Agent (Layer 1 — assistant/agent.py)."""
import json
import pytest
from unittest.mock import patch

from app.ai_agents.assistant.agent import RouterDecision, route_message
from app.services.ai.llm_utils import LLMCallResult


def _make_llm_result(response_json: list[dict], status: str = "SUCCESS") -> LLMCallResult:
    return LLMCallResult(
        agent_name="assistant",
        request_text="test",
        response_text=json.dumps(response_json),
        status=status,
        provider_used="groq",
    )


def _failed_llm_result() -> LLMCallResult:
    return LLMCallResult(
        agent_name="assistant",
        request_text="test",
        response_text="",
        status="FAILED",
        error_msg="All providers failed",
    )


def test_route_message_returns_tuple():
    llm_result = _make_llm_result([
        {"text": "What is my balance?", "agent": "bank_manager", "context": ["account_context"]}
    ])
    with patch("app.ai_agents.assistant.agent.call_llm", return_value=llm_result):
        decisions, result = route_message("What is my balance?", [])

    assert isinstance(decisions, list)
    assert isinstance(result, LLMCallResult)


def test_route_message_returns_router_decisions():
    llm_result = _make_llm_result([
        {"text": "Check my loan", "agent": "loan_officer", "context": ["loan_context"]}
    ])
    with patch("app.ai_agents.assistant.agent.call_llm", return_value=llm_result):
        decisions, _ = route_message("Check my loan", [])

    assert len(decisions) == 1
    assert isinstance(decisions[0], RouterDecision)
    assert decisions[0].agent == "loan_officer"
    assert decisions[0].text == "Check my loan"
    assert "loan_context" in decisions[0].context


def test_route_message_multiple_decisions():
    """Router can split one user message into multiple sub-queries."""
    llm_result = _make_llm_result([
        {"text": "What is my balance?", "agent": "bank_manager", "context": []},
        {"text": "Am I eligible for a loan?", "agent": "loan_officer", "context": ["bank_rules"]},
    ])
    with patch("app.ai_agents.assistant.agent.call_llm", return_value=llm_result):
        decisions, _ = route_message("Balance and loan eligibility?", [])

    assert len(decisions) == 2
    agents = {d.agent for d in decisions}
    assert "bank_manager" in agents
    assert "loan_officer" in agents


def test_route_message_fallback_on_llm_failure():
    """When LLM fails, route_message falls back to a single receptionist decision."""
    with patch("app.ai_agents.assistant.agent.call_llm", return_value=_failed_llm_result()):
        decisions, _ = route_message("Hello", [])

    assert len(decisions) == 1
    assert decisions[0].agent == "receptionist"
    assert decisions[0].text == "Hello"


def test_route_message_fallback_on_bad_json():
    """When LLM returns non-parseable JSON, fall back gracefully."""
    bad_result = LLMCallResult(
        agent_name="assistant",
        request_text="test",
        response_text="not valid json at all",
        status="SUCCESS",
        provider_used="groq",
    )
    with patch("app.ai_agents.assistant.agent.call_llm", return_value=bad_result):
        decisions, _ = route_message("Bad json test", [])

    assert len(decisions) == 1
    assert decisions[0].agent == "receptionist"


def test_route_message_passes_chat_history():
    """Chat history should be included in the LLM call."""
    llm_result = _make_llm_result([
        {"text": "follow-up", "agent": "bank_manager", "context": []}
    ])
    history = [
        {"user_message": "Hi", "assistant_response": "Hello!"},
    ]
    captured: list = []

    def mock_call_llm(agent_name, system_prompt, user_content, **kwargs):
        captured.append(user_content)
        return llm_result

    with patch("app.ai_agents.assistant.agent.call_llm", side_effect=mock_call_llm):
        route_message("follow-up question", history)

    assert len(captured) == 1
    assert "Hi" in captured[0]
    assert "Hello!" in captured[0]
