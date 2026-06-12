"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { Spinner } from "@/components/Spinner";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function NotifIcon({ type }: { type: string }) {
  const t = type?.toUpperCase();
  if (t === "CREDIT" || t === "SALARY" || t === "JOINING_BONUS") {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--success)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </div>
    );
  }
  if (t === "DEBIT") {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--danger)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      </div>
    );
  }
  if (t === "REQUEST") {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--warning)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-tertiary)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    api.get("/notifications?limit=50&unread_only=true")
      .then(({ data }) => {
        const d = data?.data ?? data;
        setNotifications(d?.notifications ?? d ?? []);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/notifications/mark-read");
      // Animate out all notifications
      setNotifications([]);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24" style={{ color: "var(--text-secondary)" }}>
        <Spinner size={20} /> Loading…
      </div>
    );
  }
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div className="max-w-lg space-y-3">
      {/* Header row */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between"
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
              style={{ color: "var(--accent)", backgroundColor: "var(--accent-muted)", border: "1px solid var(--border-default)" }}
            >
              {markingAll ? <Spinner size={12} /> : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              Mark all read
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification list */}
      <AnimatePresence mode="popLayout" initial={false}>
        {notifications.length === 0 && !loading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="card text-center py-16 space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>All caught up</p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Transfers, salary credits, and money requests will appear here.</p>
          </motion.div>
        ) : (
          notifications.map((n, i) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{
                layout: { duration: 0.2 },
                opacity: { duration: 0.22, delay: i * 0.04 },
                y: { duration: 0.22, delay: i * 0.04 },
                scale: { duration: 0.18 },
              }}
              className="flex items-start gap-3 p-4 rounded-xl group"
              style={{
                backgroundColor: n.is_read ? "var(--bg-card)" : "var(--bg-elevated)",
                border: `1px solid ${n.is_read ? "var(--border-subtle)" : "var(--border-default)"}`,
              }}
            >
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                    {n.title}
                    {!n.is_read && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full align-middle" style={{ backgroundColor: "var(--accent)" }} />
                    )}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {timeAgo(n.created_at)}
                    </span>
                    {/* Dismiss button */}
                    <button
                      onClick={() => dismiss(n.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--danger)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                      aria-label="Dismiss"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{n.body}</p>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <h1 className="page-title">Notifications</h1>
        <NotificationsContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
