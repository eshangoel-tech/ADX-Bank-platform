"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PinInput } from "@/components/PinInput";
import { Spinner } from "@/components/Spinner";

/* ─── FakePay bank list ─────────────────────────────────── */
const BANKS = [
  { id: "hdfc",  name: "HDFC Bank",  color: "#004C8F" },
  { id: "sbi",   name: "SBI",        color: "#2D6A9F" },
  { id: "icici", name: "ICICI Bank", color: "#B02020" },
  { id: "axis",  name: "Axis Bank",  color: "#800020" },
  { id: "kotak", name: "Kotak",      color: "#ED1C24" },
  { id: "yes",   name: "Yes Bank",   color: "#004B8E" },
];

type FakePayStep = "bank" | "netbanking" | "pin" | "otp";

interface FakePayProps {
  amount: string;
  topupId: string;
  hasPin: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

function FakePayModal({ amount, topupId, hasPin, onSuccess, onClose }: FakePayProps) {
  // If user has no PIN, go straight to OTP mode; otherwise default to PIN
  const [step, setStep] = useState<FakePayStep>("bank");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [nbPassword, setNbPassword] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(!hasPin); // already sent during initiate for no-pin users

  const handleNetBankingLogin = () => {
    // Go to PIN if user has PIN, else to OTP (already sent during initiate)
    setStep(hasPin ? "pin" : "otp");
  };

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    setError(null);
    try {
      await api.post("/wallet/add-money/request-otp", { topup_id: topupId });
      setOtpSent(true);
      setPin("");
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleConfirmPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) { setError("Enter your 6-digit ADX PIN."); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post("/wallet/add-money/confirm-pin", { topup_id: topupId, pin });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post("/wallet/add-money/confirm", { topup_id: topupId, otp });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const stepTitles: Record<FakePayStep, string> = {
    bank: "Select your bank",
    netbanking: "Net Banking Login",
    pin: "Authorize Payment",
    otp: "OTP Verification",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}
      >
        {/* FakePay header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: "0 2px 10px rgba(99,102,241,0.4)" }}>
              F
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>FakePay</span>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>DEMO</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Total amount</p>
            <p className="text-base font-bold" style={{ color: "var(--gold)" }}>
              ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Merchant row */}
        <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, #0e7490 100%)" }}>A</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>ADX Bank</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>adxbank.demo · Secure checkout</p>
          </div>
          <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--success)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="p-5">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--text-tertiary)" }}>
            {stepTitles[step]}
          </p>

          <AnimatePresence mode="wait" initial={false}>

            {/* Bank select */}
            {step === "bank" && (
              <motion.div key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="grid grid-cols-2 gap-2.5">
                  {BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => { setSelectedBank(b.id); setStep("netbanking"); }}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-150 cursor-pointer"
                      style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-elevated)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ backgroundColor: b.color }}>
                        {b.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{b.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center mt-4" style={{ color: "var(--text-tertiary)" }}>
                  256-bit SSL encrypted · Powered by FakePay
                </p>
              </motion.div>
            )}

            {/* Net banking form (decorative) */}
            {step === "netbanking" && (
              <motion.div key="netbanking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ backgroundColor: BANKS.find(b => b.id === selectedBank)?.color ?? "#333" }}>
                    {BANKS.find(b => b.id === selectedBank)?.name.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {BANKS.find(b => b.id === selectedBank)?.name} Net Banking
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Customer ID / Username</label>
                    <input className="input" type="text" value={userId} onChange={(e) => setUserId(e.target.value)}
                      placeholder="e.g. HDFC00123456" autoComplete="off" data-lpignore="true" data-form-type="other" />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input className="input" type="password" value={nbPassword} onChange={(e) => setNbPassword(e.target.value)}
                      placeholder="Enter net banking password" autoComplete="new-password" data-lpignore="true" />
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Demo only — these fields are decorative and not verified.
                </p>
                <div className="flex gap-2.5 mt-4">
                  <button type="button" onClick={() => setStep("bank")} className="btn-secondary flex-1 text-sm cursor-pointer">Back</button>
                  <button type="button" onClick={handleNetBankingLogin} className="btn-primary flex-1 text-sm cursor-pointer">Login →</button>
                </div>
              </motion.div>
            )}

            {/* ADX PIN — real verification */}
            {step === "pin" && (
              <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent)" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enter your 6-digit ADX PIN</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Authorizes the payment from your ADX account</p>
                </div>
                <form onSubmit={handleConfirmPin} className="space-y-4">
                  <PinInput value={pin} onChange={setPin} autoFocus />
                  {error && <p className="error-box">{error}</p>}
                  <button type="submit" disabled={loading || pin.length < 6} className="btn-primary w-full cursor-pointer">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Processing…</span>
                      : `Pay ₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </button>
                </form>
                {/* Forgot PIN fallback */}
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={requestingOtp}
                  className="w-full mt-3 py-2 text-sm font-medium cursor-pointer transition-colors duration-150"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
                >
                  {requestingOtp
                    ? <span className="flex items-center justify-center gap-2"><Spinner size={12} />Sending OTP…</span>
                    : "Forgot PIN? Use OTP instead"}
                </button>
              </motion.div>
            )}

            {/* OTP step — real verification */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {otpSent && (
                  <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-4"
                    style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--border-default)" }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--accent)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm" style={{ color: "var(--accent-hover)" }}>OTP sent to your registered email.</p>
                  </div>
                )}
                <form onSubmit={handleConfirmOtp} className="space-y-4">
                  <div>
                    <label className="label">OTP (6 digits)</label>
                    <input
                      className="input tracking-[0.5em] text-center text-lg font-bold font-mono"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  {error && <p className="error-box">{error}</p>}
                  <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full cursor-pointer">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Verifying…</span>
                      : `Verify & Pay ₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main wallet page ──────────────────────────────────── */
function WalletContent() {
  const [done, setDone] = useState(false);
  const [amount, setAmount] = useState("");
  const [topupId, setTopupId] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [addedAmount, setAddedAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFakePay, setShowFakePay] = useState(false);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/wallet/add-money/initiate", { amount: parseFloat(amount) });
      const d = data?.data ?? data;
      setTopupId(d?.topup_id);
      setHasPin(d?.has_pin ?? false);
      setAddedAmount(amount);
      setShowFakePay(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDone(false);
    setAmount(""); setTopupId(""); setAddedAmount("");
    setError(null); setShowFakePay(false);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "2px solid var(--success)" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Money Added!</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Your account has been credited successfully.</p>
          </div>
          <div className="rounded-xl p-5 space-y-1" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Amount Credited</p>
            <p className="font-display text-4xl font-bold" style={{ color: "var(--success)" }}>
              ₹{parseFloat(addedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-secondary flex-1 cursor-pointer">Add More</button>
            <a href="/dashboard" className="btn-primary flex-1 text-center">Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-md mx-auto">
        <div className="card space-y-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Add Money to Account</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Enter the amount. You&apos;ll be redirected to FakePay secure checkout.
            </p>
          </div>

          {/* FakePay trust badge */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>F</div>
            <p className="text-xs" style={{ color: "#a5b4fc" }}>
              Payments secured by <strong>FakePay</strong> — 256-bit SSL encrypted gateway
            </p>
          </div>

          <form onSubmit={handleInitiate} className="space-y-4">
            <div>
              <label className="label">Amount (INR)</label>
              <input className="input text-lg font-semibold" type="number" min="1" max="50000" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["500", "1000", "5000", "10000"].map((preset) => (
                <button key={preset} type="button" onClick={() => setAmount(preset)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                  style={amount === preset
                    ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                    : { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  ₹{parseInt(preset).toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            {error && <p className="error-box">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
              {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Initiating…</span> : "Pay via FakePay →"}
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showFakePay && (
          <FakePayModal
            amount={addedAmount}
            topupId={topupId}
            hasPin={hasPin}
            onSuccess={() => { setShowFakePay(false); setDone(true); }}
            onClose={() => setShowFakePay(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <h1 className="page-title">Add Money</h1>
        <WalletContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
