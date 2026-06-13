"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PinInput } from "@/components/PinInput";
import { Spinner } from "@/components/Spinner";
import { AnimatedCheckmark } from "@/components/AnimatedCheckmark";

interface InitiateResponse {
  transfer_id: string;
  receiver_name: string;
  receiver_account: string;
  amount: string;
  has_pin: boolean;
}

interface Contact {
  full_name: string;
  phone: string;
  account_number: string;
  account_number_masked: string;
}

type Step = "initiate" | "confirm" | "success";
type TransferMethod = "account" | "phone" | "upi";

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};


function TransferContent() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>("initiate");
  const [dir, setDir] = useState(1);
  const [method, setMethod] = useState<TransferMethod>("phone");
  const [accountNumber, setAccountNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [initData, setInitData] = useState<InitiateResponse | null>(null);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmMode, setConfirmMode] = useState<"pin" | "otp">("pin");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    api.get("/user/contacts").then(({ data }) => {
      const d = data?.data ?? data;
      setContacts(d?.contacts ?? []);
    }).catch(() => {});
  }, []);

  const goTo = (next: Step, direction = 1) => { setDir(direction); setStep(next); };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "phone" && phone.length !== 10) { setError("Enter a valid 10-digit number."); return; }
    if (method === "upi" && !upiId.includes("@")) { setError("UPI ID must be in format name@bank."); return; }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { amount: parseFloat(amount) };
      if (method === "account") body.to_account_number = accountNumber;
      else if (method === "phone") body.to_phone = phone;
      else body.to_upi = upiId;
      const { data } = await api.post("/transfer/initiate", body);
      const d = data?.data ?? data;
      setInitData(d);
      setConfirmMode(d.has_pin ? "pin" : "otp");
      if (!d.has_pin) setOtpSent(true); // OTP was auto-sent
      goTo("confirm", 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) { setError("Enter your 6-digit PIN."); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post("/transfer/confirm-pin", { transfer_id: initData?.transfer_id, pin });
      goTo("success", 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!initData) return;
    setOtpLoading(true);
    setError(null);
    try {
      await api.post("/transfer/request-otp", { transfer_id: initData.transfer_id });
      setOtpSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Enter the 6-digit OTP."); return; }
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
    setAccountNumber(""); setPhone(""); setUpiId(""); setAmount("");
    setPin(""); setOtp(""); setInitData(null); setError(null);
    setOtpSent(false); setConfirmMode("pin");
  };

  const stepIndex = step === "initiate" ? 0 : step === "confirm" ? 1 : 2;
  const stepLabels = ["Enter Details", "Confirm with PIN"];

  const METHOD_TABS: { key: TransferMethod; label: string }[] = [
    { key: "phone", label: "Mobile" },
    { key: "account", label: "Account" },
    { key: "upi", label: "UPI" },
  ];

  return (
    <div className="max-w-md mx-auto space-y-6">
      {step !== "success" && (
        <div className="flex items-center">
          {stepLabels.map((label, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200"
                    style={done ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                      : active ? { backgroundColor: "var(--accent-muted)", borderColor: "var(--accent)", color: "var(--accent)", boxShadow: "0 0 0 4px var(--accent-muted)" }
                      : { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                    {done ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : i + 1}
                  </div>
                  <span className="mt-1.5 text-xs font-medium" style={{ color: done || active ? "var(--text-primary)" : "var(--text-tertiary)" }}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-300"
                    style={{ backgroundColor: stepIndex > i ? "var(--accent)" : "var(--border-default)" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>

          {/* Success */}
          {step === "success" && (
            <motion.div key="success" initial={reduced ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
              <div className="card text-center space-y-6">
                <div className="flex justify-center"><AnimatedCheckmark /></div>
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>Transfer Successful</h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Your funds have been transferred.</p>
                </div>
                {/* UPI test disclaimer */}
                {method === "upi" && (
                  <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-left"
                    style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--warning)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs leading-relaxed" style={{ color: "#fbbf24" }}>
                      UPI transfers in ADX Bank are simulated — external UPI IDs don&apos;t have real accounts here, so only your balance was debited as a test transaction.
                    </p>
                  </div>
                )}
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
                    <span className="font-display text-xl font-bold" style={{ color: "var(--gold)" }}>₹{parseFloat(initData?.amount ?? "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a href="/dashboard" className="btn-secondary flex-1 cursor-pointer text-center">← Dashboard</a>
                  <button onClick={handleReset} className="btn-primary flex-1 cursor-pointer">New Transfer</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Initiate */}
          {step === "initiate" && (
            <motion.div key="initiate" custom={dir} variants={reduced ? {} : stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="card space-y-5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Transfer Money</h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Send via mobile number, account number, or UPI.</p>
                </div>

                {/* Method tabs */}
                <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  {METHOD_TABS.map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => { setMethod(key); setError(null); }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
                      style={method === key ? { backgroundColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px var(--accent-glow)" } : { color: "var(--text-secondary)" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Quick contacts */}
                {contacts.length > 0 && (method === "phone" || method === "account") && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-tertiary)" }}>Recent</p>
                    <div className="flex gap-2 flex-wrap">
                      {contacts.map((c) => (
                        <button
                          key={c.phone}
                          type="button"
                          onClick={() => {
                            if (method === "phone") setPhone(c.phone);
                            else setAccountNumber(c.account_number);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
                          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}>
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span>{c.full_name.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleInitiate} className="space-y-4">
                  {method === "account" && (
                    <div>
                      <label className="label">Account Number</label>
                      <input className="input font-mono" type="text" value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.toUpperCase())} placeholder="ADX0000012" required />
                    </div>
                  )}
                  {method === "phone" && (
                    <div>
                      <label className="label">Mobile Number</label>
                      <div className="flex gap-2 items-center">
                        <span className="rounded-lg px-3 py-2.5 text-sm shrink-0 select-none"
                          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>+91</span>
                        <input className="input" type="tel" value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} required />
                      </div>
                    </div>
                  )}
                  {method === "upi" && (
                    <div>
                      <label className="label">UPI ID</label>
                      <input className="input" type="text" value={upiId}
                        onChange={(e) => setUpiId(e.target.value.trim())} placeholder="name@oksbi" required />
                      <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>e.g. rahul@oksbi, priya@ybl</p>
                    </div>
                  )}
                  <div>
                    <label className="label">Amount (INR)</label>
                    <input className="input" type="number" min="1" step="0.01" value={amount}
                      onChange={(e) => setAmount(e.target.value)} placeholder="500.00" required />
                  </div>
                  {error && <p className="error-box">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Looking up…</span> : "Continue →"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: PIN Confirm */}
          {step === "confirm" && initData && (
            <motion.div key="confirm" custom={dir} variants={reduced ? {} : stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="card space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--text-tertiary)" }}>Verify Recipient</p>
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
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
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Verified
                      </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "rgba(0,0,0,0.1)" }}>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Amount</span>
                      <span className="font-display text-xl font-bold" style={{ color: "var(--gold)" }}>
                        ₹{parseFloat(initData.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--warning)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: "#fbbf24" }}>Verify recipient carefully. Transfers cannot be reversed.</p>
                </div>

                {/* PIN / OTP tabs — only show tabs if user has a PIN */}
                {initData.has_pin && (
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
                    {(["pin", "otp"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setConfirmMode(m); setError(null); }}
                        className="flex-1 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: confirmMode === m ? "var(--accent)" : "transparent",
                          color: confirmMode === m ? "#fff" : "var(--text-secondary)",
                        }}
                      >
                        {m === "pin" ? "Use PIN" : "Use OTP"}
                      </button>
                    ))}
                  </div>
                )}

                {/* PIN mode */}
                {(confirmMode === "pin" && initData.has_pin) && (
                  <form onSubmit={handleConfirm} className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enter your 6-digit ADX PIN</p>
                      <PinInput value={pin} onChange={setPin} autoFocus />
                    </div>
                    {error && <p className="error-box">{error}</p>}
                    <div className="flex gap-3">
                      <button type="button" onClick={handleReset} className="btn-secondary flex-1 cursor-pointer">← Back</button>
                      <button type="submit" disabled={loading || pin.length < 6} className="btn-primary flex-1 cursor-pointer">
                        {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Confirming…</span> : "Confirm Transfer"}
                      </button>
                    </div>
                  </form>
                )}

                {/* OTP mode */}
                {(confirmMode === "otp" || !initData.has_pin) && (
                  <form onSubmit={handleConfirmOtp} className="space-y-4">
                    {!otpSent ? (
                      <div className="space-y-3">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          An OTP will be sent to your registered email.
                        </p>
                        {error && <p className="error-box">{error}</p>}
                        <div className="flex gap-3">
                          <button type="button" onClick={handleReset} className="btn-secondary flex-1 cursor-pointer">← Back</button>
                          <button type="button" onClick={handleSendOtp} disabled={otpLoading} className="btn-primary flex-1 cursor-pointer">
                            {otpLoading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Sending…</span> : "Send OTP"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          OTP sent to your email. Enter the 6-digit code below.
                        </p>
                        <input
                          className="input text-center tracking-widest font-mono text-lg"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          autoFocus
                        />
                        {error && <p className="error-box">{error}</p>}
                        <div className="flex gap-3">
                          <button type="button" onClick={handleReset} className="btn-secondary flex-1 cursor-pointer">← Back</button>
                          <button type="submit" disabled={loading || otp.length < 6} className="btn-primary flex-1 cursor-pointer">
                            {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Confirming…</span> : "Confirm Transfer"}
                          </button>
                        </div>
                        <button type="button" onClick={handleSendOtp} disabled={otpLoading}
                          className="w-full text-xs cursor-pointer" style={{ color: "var(--accent)" }}>
                          {otpLoading ? "Sending…" : "Resend OTP"}
                        </button>
                      </div>
                    )}
                  </form>
                )}
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
        <h1 className="page-title">Transfer Money</h1>
        <TransferContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
