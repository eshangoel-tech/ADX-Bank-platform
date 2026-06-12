"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PinInput } from "@/components/PinInput";
import { Spinner } from "@/components/Spinner";

/* Backend returns { incoming: [...], outgoing: [...] }
   Each item: { id, other_name, amount, note, status, direction, expires_at, created_at } */
interface MoneyRequest {
  id: string;
  other_name: string;
  amount: string;
  note?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  direction: "incoming" | "outgoing";
  expires_at: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: "rgba(245,158,11,0.1)",  color: "var(--warning)", label: "Pending" },
  ACCEPTED: { bg: "rgba(16,185,129,0.1)",  color: "var(--success)", label: "Paid" },
  REJECTED: { bg: "rgba(239,68,68,0.08)",  color: "var(--danger)",  label: "Declined" },
  EXPIRED:  { bg: "var(--bg-elevated)",    color: "var(--text-tertiary)", label: "Expired" },
};

function RequestCard({ req, onAction }: { req: MoneyRequest; onAction: () => void }) {
  const [paying, setPaying] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIncoming = req.direction === "incoming";
  const st = STATUS_STYLE[req.status] ?? STATUS_STYLE.EXPIRED;

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) { setError("Enter your 6-digit PIN."); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/money-requests/${req.id}/accept`, { pin });
      onAction();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/money-requests/${req.id}/decline`);
      onAction();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", border: "1px solid var(--border-default)" }}>
            {req.other_name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{req.other_name}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {isIncoming ? "requested from you" : "you requested from them"} · {timeAgo(req.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-lg font-bold" style={{ color: isIncoming ? "var(--danger)" : "var(--gold)" }}>
            {isIncoming ? "-" : "+"}₹{parseFloat(req.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>
      </div>

      {req.note && (
        <p className="text-sm italic px-3 py-2 rounded-lg"
          style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
          &ldquo;{req.note}&rdquo;
        </p>
      )}

      {isIncoming && req.status === "PENDING" && (
        <AnimatePresence mode="wait">
          {!paying ? (
            <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex gap-2 pt-1">
              <button onClick={handleDecline} disabled={loading}
                className="btn-secondary flex-1 text-sm cursor-pointer"
                style={{ color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}>
                {loading ? <Spinner size={14} /> : "Decline"}
              </button>
              <button onClick={() => setPaying(true)} className="btn-primary flex-1 text-sm cursor-pointer">
                Pay Now
              </button>
            </motion.div>
          ) : (
            <motion.form key="pin-form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onSubmit={handleAccept} className="space-y-3 pt-1">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                  Enter ADX PIN to pay
                </p>
                <PinInput value={pin} onChange={setPin} autoFocus />
              </div>
              {error && <p className="error-box">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setPaying(false); setPin(""); setError(null); }}
                  className="btn-secondary flex-1 text-sm cursor-pointer">Cancel</button>
                <button type="submit" disabled={loading || pin.length < 6} className="btn-primary flex-1 text-sm cursor-pointer">
                  {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={14} />Paying…</span> : "Confirm Pay"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function RequestsContent() {
  const [incoming, setIncoming] = useState<MoneyRequest[]>([]);
  const [outgoing, setOutgoing] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    api.get("/money-requests")
      .then(({ data }) => {
        const d = data?.data ?? data;
        setIncoming(d?.incoming ?? []);
        setOutgoing(d?.outgoing ?? []);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { setSendError("Enter a valid 10-digit mobile number."); return; }
    setSending(true);
    setSendError(null);
    try {
      await api.post("/money-requests", {
        to_phone: phone,
        amount: parseFloat(amount),
        note: note.trim() || undefined,
      });
      setSent(true);
      setPhone(""); setAmount(""); setNote("");
      fetchRequests();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setSendError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const pendingCount = incoming.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-lg space-y-6">

      {/* ── Send Request ── */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Request Money</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Ask someone to pay you. They&apos;ll get a notification with a Pay Now button.
          </p>
        </div>

        {sent && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Request sent! They&apos;ll be notified shortly.</p>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="label">Their Mobile Number</label>
            <div className="flex gap-2 items-center">
              <span className="rounded-lg px-3 py-2.5 text-sm shrink-0 select-none"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>+91</span>
              <input className="input" type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210" maxLength={10} required />
            </div>
          </div>
          <div>
            <label className="label">Amount (INR)</label>
            <input className="input" type="number" min="1" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="500.00" required />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" type="text" value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="e.g. For lunch yesterday" maxLength={200} />
          </div>
          {sendError && <p className="error-box">{sendError}</p>}
          <button type="submit" disabled={sending} className="btn-primary w-full cursor-pointer">
            {sending ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Sending…</span> : "Send Request →"}
          </button>
        </form>
      </div>

      {/* ── Lists ── */}
      {loading ? (
        <div className="flex items-center gap-3 py-8 justify-center" style={{ color: "var(--text-secondary)" }}>
          <Spinner size={18} /> Loading requests…
        </div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : (
        <>
          {incoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Incoming</h2>
                {pendingCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
                    {pendingCount} pending
                  </span>
                )}
              </div>
              {incoming.map((r) => (
                <RequestCard key={r.id} req={r} onAction={fetchRequests} />
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Outgoing</h2>
              {outgoing.map((r) => (
                <RequestCard key={r.id} req={r} onAction={fetchRequests} />
              ))}
            </div>
          )}

          {incoming.length === 0 && outgoing.length === 0 && (
            <div className="card text-center py-12 space-y-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No requests yet</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Send a request above or wait for someone to request money from you.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <h1 className="page-title">Money Requests</h1>
        <RequestsContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
