"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { Spinner } from "@/components/Spinner";

interface InitiateResponse {
  transfer_id: string;
  receiver_name: string;
  receiver_account: string;
  amount: string;
}

type Step = "initiate" | "confirm" | "success";
type TransferMethod = "account" | "phone";

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

function AnimatedCheckmark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle
        cx="32" cy="32" r="25"
        stroke="var(--success)"
        strokeWidth="3"
        strokeLinecap="round"
        className="success-circle"
        style={{ fill: "rgba(16,185,129,0.08)" }}
      />
      <path
        d="M20 33l8 8 16-16"
        stroke="var(--success)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="success-check"
      />
    </svg>
  );
}

function TransferContent() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>("initiate");
  const [dir, setDir] = useState(1);
  const [method, setMethod] = useState<TransferMethod>("account");
  const [accountNumber, setAccountNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [initData, setInitData] = useState<InitiateResponse | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goTo = (next: Step, direction = 1) => {
    setDir(direction);
    setStep(next);
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "phone" && phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { amount: parseFloat(amount) };
      if (method === "account") body.to_account_number = accountNumber;
      else body.to_phone = phone;
      const { data } = await api.post("/transfer/initiate", body);
      setInitData(data?.data ?? data);
      goTo("confirm", 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/transfer/confirm", { transfer_id: initData?.transfer_id, otp });
      goTo("success", 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    goTo("initiate", -1);
    setAccountNumber(""); setPhone(""); setAmount(""); setOtp(""); setInitData(null); setError(null);
  };

  // Step indicator
  const stepIndex = step === "initiate" ? 0 : step === "confirm" ? 1 : 2;
  const stepLabels = ["Enter Details", "Verify & Confirm"];

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Progress line */}
      {step !== "success" && (
        <div className="flex items-center">
          {stepLabels.map((label, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200"
                    style={
                      done
                        ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                        : active
                        ? { backgroundColor: "var(--accent-muted)", borderColor: "var(--accent)", color: "var(--accent)", boxShadow: "0 0 0 4px var(--accent-muted)" }
                        : { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-tertiary)" }
                    }
                  >
                    {done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className="mt-1.5 text-xs font-medium" style={{ color: done || active ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-300"
                    style={{ backgroundColor: stepIndex > i ? "var(--accent)" : "var(--border-default)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Animated step content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          {/* Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="card text-center space-y-6">
                <div className="flex justify-center">
                  <AnimatedCheckmark />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Transfer Successful
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Your funds have been transferred successfully.
                  </p>
                </div>
                <div className="rounded-xl p-4 text-left space-y-3" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Recipient</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{initData?.receiver_name}</p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{initData?.receiver_account}</p>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Amount</span>
                    <span className="font-display text-xl font-bold" style={{ color: "var(--gold)" }}>
                      ₹{parseFloat(initData?.amount ?? "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Transfer ID</span>
                    <span className="text-xs font-mono truncate max-w-[60%]" style={{ color: "var(--text-secondary)" }}>
                      {initData?.transfer_id}
                    </span>
                  </div>
                </div>
                <button onClick={handleReset} className="btn-primary w-full cursor-pointer">New Transfer</button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Initiate */}
          {step === "initiate" && (
            <motion.div
              key="initiate"
              custom={dir}
              variants={reduced ? {} : stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="card space-y-5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Transfer Details</h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Send money via account or mobile number.</p>
                </div>

                {/* Method toggle */}
                <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  {(["account", "phone"] as TransferMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMethod(m); setError(null); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
                      style={
                        method === m
                          ? { backgroundColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px var(--accent-glow)" }
                          : { color: "var(--text-secondary)" }
                      }
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {m === "account"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        }
                      </svg>
                      {m === "account" ? "Account No." : "Mobile No."}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleInitiate} className="space-y-4">
                  {method === "account" ? (
                    <div>
                      <label className="label">Recipient Account Number</label>
                      <input className="input font-mono" type="text" value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.toUpperCase())} placeholder="ADX0000012" required />
                    </div>
                  ) : (
                    <div>
                      <label className="label">Recipient Mobile Number</label>
                      <div className="flex gap-2 items-center">
                        <span className="rounded-lg px-3 py-2.5 text-sm shrink-0 select-none" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                          +91
                        </span>
                        <input className="input" type="tel" value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} required />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="label">Amount (INR)</label>
                    <input className="input" type="number" min="1" step="0.01" value={amount}
                      onChange={(e) => setAmount(e.target.value)} placeholder="500.00" required />
                  </div>
                  {error && <p className="error-box">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} /> Looking up recipient…</span> : "Continue →"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && initData && (
            <motion.div
              key="confirm"
              custom={dir}
              variants={reduced ? {} : stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="card space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--text-tertiary)" }}>
                    Verify Recipient
                  </p>
                  <motion.div
                    className="rounded-xl overflow-hidden"
                    initial={reduced ? false : { scale: 0.97, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold"
                        style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--border-default)", color: "var(--accent)" }}>
                        {initData.receiver_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{initData.receiver_name}</p>
                        <p className="text-sm font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>{initData.receiver_account}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "rgba(0,0,0,0.1)" }}>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Amount to send</span>
                      <span className="font-display text-xl font-bold" style={{ color: "var(--gold)" }}>
                        ₹{parseFloat(initData.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--warning)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: "#fbbf24" }}>
                    Verify recipient details above. Transfers cannot be reversed once confirmed.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--border-default)" }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--accent)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm" style={{ color: "var(--accent-hover)" }}>OTP sent to your registered email.</p>
                </div>

                <form onSubmit={handleConfirm} className="space-y-4">
                  <div>
                    <label className="label">Enter OTP</label>
                    <input className="input tracking-[0.5em] text-center text-lg font-bold font-mono" type="text"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •" maxLength={6} autoFocus required />
                  </div>
                  {error && <p className="error-box">{error}</p>}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={handleReset} className="btn-secondary flex-1 cursor-pointer">← Back</button>
                    <button type="submit" disabled={loading || otp.length < 6} className="btn-primary flex-1 cursor-pointer">
                      {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} /> Confirming…</span> : "Confirm Transfer"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TransferPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <h1 className="page-title">Internal Transfer</h1>
        <TransferContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
