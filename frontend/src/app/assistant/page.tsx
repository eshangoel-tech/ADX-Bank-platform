"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Spinner } from "@/components/Spinner";
import { TypingIndicator } from "@/components/TypingIndicator";
import { api, getErrorMessage } from "@/services/api";

interface RedirectAction {
  name: string;
  label: string;
  url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: RedirectAction[];
}

function AssistantChat() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [chatSessId, setChatSessId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let sessId = "";
    const start = async () => {
      try {
        const res = await api.post("/ai/assistant/start");
        const { chat_sess_id, chat_history } = res.data.data;
        sessId = chat_sess_id;
        setChatSessId(sessId);
        const history: Message[] = (chat_history ?? []).flatMap(
          (turn: { user_message: string; assistant_response: string }, i: number) => [
            { id: `h-user-${i}`, role: "user" as const, text: turn.user_message },
            { id: `h-bot-${i}`, role: "assistant" as const, text: turn.assistant_response, actions: [] },
          ]
        );
        setMessages(
          history.length > 0
            ? history
            : [{ id: "welcome", role: "assistant", text: "Hello! I'm your ADX Bank assistant. How can I help you today?", actions: [] }]
        );
      } catch (err) {
        setError("Could not start assistant: " + getErrorMessage(err));
      } finally {
        setStarting(false);
      }
    };
    start();
    return () => {
      if (sessId && !stoppedRef.current) {
        stoppedRef.current = true;
        api.post("/ai/assistant/stop", { chat_sess_id: sessId }).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const stopSession = useCallback(async () => {
    if (!chatSessId || stoppedRef.current) return;
    stoppedRef.current = true;
    try { await api.post("/ai/assistant/stop", { chat_sess_id: chatSessId }); } catch {}
    router.push("/dashboard");
  }, [chatSessId, router]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !chatSessId || loading) return;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text }]);
    setLoading(true);
    try {
      const res = await api.post("/ai/assistant/chat", { chat_sess_id: chatSessId, message: text });
      const { response, actions } = res.data.data;
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: response, actions: actions ?? [] }]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (starting) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: "var(--text-secondary)" }}>
        <Spinner size={28} />
        <span className="text-sm">Starting assistant…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ADX Assistant
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            3-layer AI · Powered by multi-agent pipeline
          </p>
        </div>
        <button onClick={stopSession} className="btn-secondary text-xs px-3 py-1.5 cursor-pointer">
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--accent) 0%, #0e7490 100%)" }}
                    >
                      A
                    </div>
                  )}
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { backgroundColor: "var(--accent)", color: "#fff", borderBottomRightRadius: "4px" }
                        : {
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            borderBottomLeftRadius: "4px",
                            borderLeft: "2px solid var(--accent)",
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Action buttons */}
                {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-9">
                    {msg.actions.map((action) => (
                      <motion.button
                        key={action.name}
                        onClick={() => router.push(action.url)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: "var(--accent-muted)",
                          color: "var(--accent-hover)",
                          border: "1px solid var(--border-default)",
                        }}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 10px var(--accent-glow)" }}
                      >
                        {action.label} →
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-end gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--accent) 0%, #0e7490 100%)" }}
                >
                  A
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderBottomLeftRadius: "4px",
                    borderLeft: "2px solid var(--accent)",
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <p className="text-xs mb-2 text-center" style={{ color: "var(--danger)" }}>{error}</p>}

      {/* Input */}
      <div
        className="flex gap-2 items-center rounded-xl px-3 py-2 shrink-0 transition-all duration-150"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
        onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--accent-muted)"; }}
        onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your account…"
          disabled={loading}
          className="flex-1 text-sm outline-none bg-transparent disabled:opacity-50"
          style={{ color: "var(--text-primary)" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--accent)" }}
          aria-label="Send message"
        >
          {loading
            ? <Spinner size={14} />
            : <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
          }
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
        ADX Assistant · Demo mode · Not financial advice
      </p>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <ProtectedRoute>
      <AssistantChat />
    </ProtectedRoute>
  );
}
