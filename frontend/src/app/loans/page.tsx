"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PinInput } from "@/components/PinInput";
import { Spinner } from "@/components/Spinner";

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcEMI(principal: number, annualRatePct: number, months: number): number {
  if (!principal || !months) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function inr(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function useCountUp(target: number, duration = 400) {
  const [count, setCount] = useState(target);
  const raf = useRef<number | null>(null);
  const prevTarget = useRef(target);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) return;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setCount(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return count;
}

// ── Stepper ───────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: "Eligibility", desc: "Check limit" },
  { label: "Simulate", desc: "Calculate EMI" },
  { label: "Book", desc: "Submit request" },
  { label: "Confirm", desc: "Verify OTP" },
] as const;

function Stepper({ current, completedUpTo, onChange }: {
  current: number; completedUpTo: number; onChange: (step: number) => void;
}) {
  return (
    <div className="flex items-start w-full mb-8 select-none">
      {WIZARD_STEPS.map((step, i) => {
        const done = i < completedUpTo;
        const active = i === current;
        const clickable = i <= completedUpTo;
        return (
          <div key={step.label} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => clickable && onChange(i)}
                disabled={!clickable}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200"
                style={
                  done
                    ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                    : active
                    ? { backgroundColor: "var(--accent-muted)", borderColor: "var(--accent)", color: "var(--accent)", boxShadow: "0 0 0 4px var(--accent-muted)" }
                    : { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-tertiary)" }
                }
              >
                {done ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </button>
              <span className="mt-2 text-xs font-semibold text-center leading-tight" style={{ color: done || active ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                {step.label}
              </span>
              <span className="text-[10px] text-center leading-tight" style={{ color: active ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                {step.desc}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mt-5 mx-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i < completedUpTo ? "var(--accent)" : "var(--border-default)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Eligibility ───────────────────────────────────────────────────────
interface EligibilityData {
  max_eligible_amount: string;
  min_loan_amount?: string;
  interest_rate: string;
  max_tenure_months?: number;
  allowed_tenures?: number[];
  processing_fee_percent?: number;
}

function EligibilityStep({ onNext }: { onNext: (data: EligibilityData) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EligibilityData | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get("/loan/eligibility");
      const d: EligibilityData = res?.data ?? res;
      setData(d);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>Check Loan Eligibility</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>We'll calculate your maximum eligible amount based on your account.</p>
      </div>
      {!data && (
        <button onClick={handleCheck} disabled={loading} className="btn-primary cursor-pointer">
          {loading ? <span className="flex items-center gap-2"><Spinner size={16} /> Checking…</span> : "Check Eligibility"}
        </button>
      )}
      {error && <p className="error-box">{error}</p>}
      {data && (
        <AnimatePresence>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>You&apos;re eligible for a loan!</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Review your limits below, then continue.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Max Amount", value: `₹${inr(parseFloat(data.max_eligible_amount))}` },
                { label: "Interest Rate", value: `${data.interest_rate}% p.a.` },
                { label: "Tenures", value: data.allowed_tenures ? `${data.allowed_tenures[0]}–${data.allowed_tenures[data.allowed_tenures.length - 1]} mo` : `Up to ${data.max_tenure_months} mo` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-4 text-center"
                  style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--text-tertiary)" }}>{item.label}</p>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                </div>
              ))}
            </div>
            <button onClick={() => onNext(data)} className="btn-primary w-full cursor-pointer">
              Continue to Simulator →
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Step 2: Simulate ──────────────────────────────────────────────────────────
function SimulateStep({ onNext, onPrefill, eligibilityData }: {
  onNext: () => void; onPrefill: (amount: string, tenure: string) => void;
  eligibilityData: EligibilityData | null;
}) {
  const reduced = useReducedMotion();
  const minAmount = parseInt(eligibilityData?.min_loan_amount ?? "1000");
  const maxAmount = Math.floor(parseFloat(eligibilityData?.max_eligible_amount ?? "600000"));
  const annualRate = parseFloat(eligibilityData?.interest_rate ?? "12");
  const allowedTenures: number[] = eligibilityData?.allowed_tenures ?? [6, 12, 18, 24];
  const processingFeePct = eligibilityData?.processing_fee_percent ?? 1;

  const [amount, setAmount] = useState(Math.min(100000, maxAmount));
  const [tenure, setTenure] = useState(allowedTenures[1] ?? allowedTenures[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emi = useMemo(() => calcEMI(amount, annualRate, tenure), [amount, annualRate, tenure]);
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - amount;
  const processingFee = Math.round(amount * (processingFeePct / 100));
  const sliderPct = ((amount - minAmount) / (maxAmount - minAmount)) * 100;
  const interestPct = Math.round((totalInterest / totalPayable) * 100);
  const animatedEmi = useCountUp(Math.round(emi));

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/loan/simulate", { amount, tenure_months: tenure });
      onPrefill(String(amount), String(tenure));
      onNext();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>Simulate EMI</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Adjust to find the plan that suits you.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-7">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Loan Amount</label>
              <div className="rounded-lg px-3 py-1" style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--border-default)" }}>
                <span className="text-base font-bold" style={{ color: "var(--accent-hover)" }}>₹{inr(amount)}</span>
              </div>
            </div>
            <input type="range" className="loan-slider" min={minAmount} max={maxAmount} step={1000} value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ background: `linear-gradient(to right, var(--accent) ${sliderPct}%, var(--border-default) ${sliderPct}%)` }} />
            <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
              <span>₹{inr(minAmount)}</span><span>₹{inr(maxAmount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Tenure</label>
              <span className="text-sm font-bold" style={{ color: "var(--accent-hover)" }}>{tenure} months</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allowedTenures.map((t) => (
                <motion.button key={t} type="button" onClick={() => setTenure(t)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 cursor-pointer"
                  style={
                    tenure === t
                      ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px var(--accent-glow)" }
                      : { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }
                  }
                  whileHover={reduced ? {} : { scale: 1.04 }}
                  whileTap={reduced ? {} : { scale: 0.97 }}
                >
                  {t} mo
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* EMI summary card */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)", border: "1px solid var(--border-default)" }}>
          <div className="text-center pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>Monthly EMI</p>
            <p className="font-display font-bold" style={{ fontSize: "clamp(2rem, 6vw, 2.5rem)", color: "var(--text-primary)" }}>
              ₹{inr(animatedEmi)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>for {tenure} months</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Principal", value: `₹${inr(amount)}`, color: "var(--text-primary)" },
              { label: "Total Interest", value: `₹${inr(Math.round(totalInterest))}`, color: "var(--warning)" },
              { label: `Processing Fee (${processingFeePct}%)`, value: `₹${inr(processingFee)}`, color: "var(--text-secondary)" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
            <div className="pt-2 flex justify-between items-center" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Total Payable</span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>₹{inr(Math.round(totalPayable))}</span>
            </div>
          </div>

          {/* Principal vs Interest bar */}
          <div className="space-y-1.5">
            <div className="flex rounded-full overflow-hidden h-2" style={{ backgroundColor: "var(--border-default)" }}>
              <div className="h-full transition-all duration-300 rounded-l-full" style={{ width: `${100 - interestPct}%`, backgroundColor: "var(--accent)" }} />
              <div className="h-full transition-all duration-300 rounded-r-full" style={{ width: `${interestPct}%`, backgroundColor: "var(--warning)" }} />
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--accent)" }} />
                Principal {100 - interestPct}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--warning)" }} />
                Interest {interestPct}%
              </span>
            </div>
          </div>

          <p className="text-[10px] text-center" style={{ color: "var(--text-tertiary)" }}>@ {annualRate}% p.a. · Indicative values only</p>
        </div>
      </div>
      {error && <p className="error-box">{error}</p>}
      <div className="flex justify-end pt-1">
        <button onClick={handleProceed} disabled={loading} className="btn-primary px-6 cursor-pointer">
          {loading ? <span className="flex items-center gap-2"><Spinner size={16} /> Saving…</span> : "Proceed to Book →"}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Book ──────────────────────────────────────────────────────────────
function BookStep({ prefillAmount, prefillTenure, onBooked }: {
  prefillAmount: string; prefillTenure: string; onBooked: (bookingId: string) => void;
}) {
  const [amount, setAmount] = useState(prefillAmount);
  const [tenure, setTenure] = useState(prefillTenure);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillAmount) setAmount(prefillAmount);
    if (prefillTenure) setTenure(prefillTenure);
  }, [prefillAmount, prefillTenure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/loan/book", { amount: parseFloat(amount), tenure_months: parseInt(tenure) });
      const bid = data?.data?.booking_id ?? data?.booking_id;
      if (bid) onBooked(bid);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>Book Loan</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Confirm the details and submit your request.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Loan Amount (INR)</label>
          <input className="input" type="number" min="1000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="label">Tenure (months)</label>
          <input className="input" type="number" min="1" value={tenure} onChange={(e) => setTenure(e.target.value)} required />
        </div>
        {error && <p className="error-box">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
          {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} /> Submitting…</span> : "Submit Loan Request →"}
        </button>
      </form>
    </div>
  );
}

// ── Step 4: Confirm OTP ───────────────────────────────────────────────────────
function ConfirmStep({ prefillBookingId, onConfirmed }: { prefillBookingId: string; onConfirmed: () => void }) {
  const [bookingId, setBookingId] = useState(prefillBookingId);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (prefillBookingId) setBookingId(prefillBookingId); }, [prefillBookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/loan/confirm", { booking_id: bookingId, otp });
      setSuccess(true);
      setTimeout(onConfirmed, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div className="text-center space-y-4 py-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="flex justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="25" stroke="var(--success)" strokeWidth="3" className="success-circle" style={{ fill: "rgba(16,185,129,0.08)" }} />
            <path d="M20 33l8 8 16-16" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-check" />
          </svg>
        </div>
        <p className="font-display text-lg font-bold" style={{ color: "var(--success)" }}>Loan Approved!</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Redirecting to your loans…</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>Confirm with OTP</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>An OTP has been sent to your registered email.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Booking ID</label>
          <input className="input font-mono text-sm" type="text" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
        </div>
        <div>
          <label className="label">OTP</label>
          <input className="input tracking-[0.5em] text-center text-lg font-bold font-mono" type="text"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" maxLength={6} autoFocus required />
        </div>
        {error && <p className="error-box">{error}</p>}
        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full cursor-pointer">
          {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} /> Verifying…</span> : "Confirm Loan"}
        </button>
      </form>
    </div>
  );
}

// ── Manage Loans ──────────────────────────────────────────────────────────────
interface LoanRecord {
  id: string; status: string; principal_amount: string; emi_amount: string;
  outstanding_amount: string; tenure_months: number; interest_rate: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-green", PENDING: "badge-yellow", CLOSED: "badge-gray", REJECTED: "badge-red",
};

const FORECLOSURE_FEE_PCT = 2;

function ManageLoansPanel() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ loanId: string; type: "emi" | "full" } | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<"emi" | "full" | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/loan/list");
      setLoans(data?.data?.loans ?? data?.loans ?? data?.data ?? data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startAction = (loanId: string, type: "emi" | "full") => {
    setActiveAction({ loanId, type });
    setPinValue("");
    setPayError(null);
    setSuccessId(null);
  };

  const cancelAction = () => { setActiveAction(null); setPinValue(""); setPayError(null); };

  const handlePayPin = async (e: React.FormEvent, loan: LoanRecord) => {
    e.preventDefault();
    if (pinValue.length < 6) return;
    setPayLoading(true);
    setPayError(null);
    try {
      if (activeAction!.type === "emi") {
        await api.post(`/loan/${loan.id}/pay-pin`, { pin: pinValue });
        setSuccessType("emi");
      } else {
        await api.post(`/loan/${loan.id}/foreclose-pin`, { pin: pinValue });
        setSuccessType("full");
      }
      setSuccessId(loan.id);
      setActiveAction(null);
      setPinValue("");
      fetchLoans();
    } catch (err) {
      setPayError(getErrorMessage(err));
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>My Loans</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>View loans, pay EMIs, or foreclose.</p>
        </div>
        <button onClick={fetchLoans} disabled={loading} className="btn-primary cursor-pointer">
          {loading ? <span className="flex items-center gap-2"><Spinner size={16} /> Loading…</span> : "Refresh"}
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loans.length > 0 ? (
        <div className="space-y-3">
          {loans.map((loan) => {
            const principal = parseFloat(loan.principal_amount);
            const outstanding = parseFloat(loan.outstanding_amount);
            const emiAmt = parseFloat(loan.emi_amount);
            const emisPaid = Math.max(0, Math.round((principal - outstanding) / emiAmt));
            const emisLeft = loan.tenure_months - emisPaid;
            const emisProgress = Math.min(100, (emisPaid / loan.tenure_months) * 100);
            const fcFee = Math.round(outstanding * (FORECLOSURE_FEE_PCT / 100) * 100) / 100;
            const fcTotal = outstanding + fcFee;
            const isActive = activeAction?.loanId === loan.id;
            const isEmiFlow = isActive && activeAction?.type === "emi";
            const isFullFlow = isActive && activeAction?.type === "full";

            return (
              <div key={loan.id} className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>

                <div className="flex items-start justify-between gap-4">
                  {/* Left: loan info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
                        ₹{principal.toLocaleString("en-IN")}
                      </span>
                      <span className={STATUS_BADGE[loan.status] ?? "badge-gray"}>{loan.status}</span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        { label: "EMI", value: `₹${emiAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
                        { label: "Outstanding", value: `₹${outstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
                        { label: "Tenure", value: `${loan.tenure_months}mo @ ${loan.interest_rate}%` },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{item.label}</p>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* EMI progress bar */}
                    {loan.status === "ACTIVE" && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>EMIs paid</span>
                          <span className="text-[10px] font-bold font-mono" style={{ color: "var(--text-secondary)" }}>
                            {emisPaid} / {loan.tenure_months}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-default)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${emisProgress}%`, backgroundColor: "var(--accent)" }}
                          />
                        </div>
                        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {emisLeft > 0 ? `${emisLeft} EMI${emisLeft !== 1 ? "s" : ""} remaining` : "Last EMI due"}
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] font-mono mt-2 truncate" style={{ color: "var(--text-tertiary)" }}>{loan.id}</p>
                  </div>

                  {/* Right: action buttons */}
                  {loan.status === "ACTIVE" && !isActive && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => startAction(loan.id, "emi")}
                        className="btn-primary text-xs py-1.5 px-3 cursor-pointer"
                      >
                        Pay EMI
                      </button>
                      <button
                        onClick={() => startAction(loan.id, "full")}
                        className="text-xs py-1.5 px-3 rounded-lg font-semibold transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.08)",
                          color: "var(--warning)",
                          border: "1px solid rgba(245,158,11,0.35)",
                        }}
                      >
                        Pay Full
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Inline action panel ── */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <form
                        onSubmit={(e) => handlePayPin(e, loan)}
                        className="mt-4 pt-4 space-y-4"
                        style={{ borderTop: "1px solid var(--border-subtle)" }}
                      >
                        {/* Foreclosure summary */}
                        {isFullFlow && (
                          <div className="rounded-xl p-4 space-y-3"
                            style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.3)" }}>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--warning)" }}>
                              Foreclosure Summary
                            </p>
                            <div className="space-y-2">
                              {[
                                { label: "Outstanding Balance", value: `₹${inr(outstanding)}`, color: "var(--text-primary)" },
                                { label: `Foreclosure Fee (${FORECLOSURE_FEE_PCT}%)`, value: `₹${inr(fcFee)}`, color: "var(--warning)" },
                              ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                                  <span className="text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-2"
                                style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Total Debit</span>
                                <span className="text-sm font-bold" style={{ color: "var(--danger)" }}>₹{inr(fcTotal)}</span>
                              </div>
                            </div>
                            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                              This will permanently close your loan account.
                            </p>
                          </div>
                        )}

                        {/* EMI flow header */}
                        {isEmiFlow && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent)" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              Enter PIN to pay ₹{inr(emiAmt)} EMI
                            </p>
                          </div>
                        )}

                        <PinInput value={pinValue} onChange={setPinValue} autoFocus />
                        {payError && <p className="error-box">{payError}</p>}

                        <div className="flex gap-2">
                          <button type="button" onClick={cancelAction}
                            className="btn-secondary flex-1 text-xs cursor-pointer">
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={payLoading || pinValue.length < 6}
                            className="flex-1 text-xs py-2 px-4 rounded-lg font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50"
                            style={isFullFlow
                              ? { backgroundColor: "var(--warning)", color: "#fff", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }
                              : { backgroundColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px var(--accent-glow)" }
                            }
                          >
                            {payLoading
                              ? <span className="flex items-center justify-center gap-1.5"><Spinner size={12} /> Processing…</span>
                              : isFullFlow ? "Close Loan & Pay" : "Confirm EMI"
                            }
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Success feedback ── */}
                <AnimatePresence>
                  {successId === loan.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 pt-3 flex items-center gap-2"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium" style={{ color: "var(--success)" }}>
                        {successType === "full" ? "Loan foreclosed and closed successfully." : "EMI paid successfully."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No active loans. Apply for one above.</p>
          </div>
        )
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type Section = "apply" | "manage";

function LoansContent() {
  const [section, setSection] = useState<Section>("apply");
  const [wizardStep, setWizardStep] = useState(0);
  const [completedUpTo, setCompletedUpTo] = useState(0);
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [prefillAmount, setPrefillAmount] = useState("");
  const [prefillTenure, setPrefillTenure] = useState("");

  const advance = () => {
    const next = wizardStep + 1;
    setCompletedUpTo(Math.max(completedUpTo, next));
    setWizardStep(next);
  };

  return (
    <div>
      {/* Section switcher */}
      <div className="flex gap-1 mb-8 rounded-xl p-1 w-fit" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        {(["apply", "manage"] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
            style={
              section === s
                ? { backgroundColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px var(--accent-glow)" }
                : { color: "var(--text-secondary)" }
            }>
            {s === "apply" ? "Apply for a Loan" : "Manage Loans"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="card">
            {section === "apply" && (
              <>
                <Stepper current={wizardStep} completedUpTo={completedUpTo} onChange={setWizardStep} />
                <div className="pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {wizardStep === 0 && <EligibilityStep onNext={(d) => { setEligibilityData(d); advance(); }} />}
                  {wizardStep === 1 && (
                    <SimulateStep eligibilityData={eligibilityData} onNext={advance}
                      onPrefill={(amt, ten) => { setPrefillAmount(amt); setPrefillTenure(ten); setCompletedUpTo(Math.max(completedUpTo, 2)); }} />
                  )}
                  {wizardStep === 2 && (
                    <BookStep prefillAmount={prefillAmount} prefillTenure={prefillTenure}
                      onBooked={(id) => { setBookingId(id); advance(); }} />
                  )}
                  {wizardStep === 3 && (
                    <ConfirmStep prefillBookingId={bookingId} onConfirmed={() => {
                      setWizardStep(0);
                      setCompletedUpTo(0);
                      setEligibilityData(null);
                      setBookingId("");
                      setPrefillAmount("");
                      setPrefillTenure("");
                      setSection("manage");
                    }} />
                  )}
                </div>
              </>
            )}
            {section === "manage" && <ManageLoansPanel />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function LoansPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <h1 className="page-title">Loans</h1>
        <LoansContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
