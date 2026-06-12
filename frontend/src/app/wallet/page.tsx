"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

type Step = "initiate" | "confirm" | "success";

function WalletContent() {
  const [step, setStep] = useState<Step>("initiate");
  const [amount, setAmount] = useState("");
  const [topupId, setTopupId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedAmount, setAddedAmount] = useState("");

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/wallet/add-money/initiate", {
        amount: parseFloat(amount),
      });
      const d = data?.data ?? data;
      setTopupId(d?.topup_id);
      setAddedAmount(amount);
      setStep("confirm");
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
      await api.post("/wallet/add-money/confirm", {
        topup_id: topupId,
        otp,
      });
      setStep("success");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("initiate");
    setAmount("");
    setTopupId("");
    setOtp("");
    setError(null);
    setAddedAmount("");
  };

  const steps = ["Enter Amount", "Confirm OTP"];
  const stepIndex = step === "initiate" ? 0 : 1;

  if (step === "success") {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Money Added!</h2>
            <p className="text-sm text-slate-400 mt-1">Your account has been credited successfully.</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Amount Credited</p>
            <p className="text-3xl font-bold text-emerald-400">
              ₹{parseFloat(addedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-secondary flex-1">
              Add More Money
            </button>
            <a href="/dashboard" className="btn-primary flex-1 text-center">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center">
        {steps.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                  done ? "bg-blue-600 border-blue-600 text-white"
                  : active ? "bg-blue-600/20 border-blue-500 text-blue-400 ring-4 ring-blue-500/10"
                  : "bg-slate-800 border-slate-700 text-slate-500"
                }`}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`mt-1.5 text-xs font-medium ${done || active ? "text-slate-200" : "text-slate-600"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors duration-300 ${stepIndex > i ? "bg-blue-600" : "bg-slate-800"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === "initiate" && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-100">Add Money to Account</h2>
            <p className="text-sm text-slate-400 mt-0.5">Enter the amount you want to top up. Max ₹50,000 per transaction.</p>
          </div>
          <form onSubmit={handleInitiate} className="space-y-4">
            <div>
              <label className="label">Amount (INR)</label>
              <input
                className="input text-lg font-semibold"
                type="number"
                min="1"
                max="50000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-2 flex-wrap">
              {["500", "1000", "5000", "10000"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    amount === preset
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  }`}
                >
                  ₹{parseInt(preset).toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : "Continue →"}
            </button>
          </form>
        </div>
      )}

      {/* Step 2 */}
      {step === "confirm" && (
        <div className="card space-y-5">
          {/* Amount summary */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Adding to your account</p>
            <p className="text-3xl font-bold text-emerald-400">
              ₹{parseFloat(addedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-blue-900/20 border border-blue-800/40 rounded-lg px-3.5 py-2.5">
            <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-blue-300">An OTP has been sent to your registered email.</p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="label">Enter OTP</label>
              <input
                className="input tracking-[0.5em] text-center text-lg font-bold"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleReset} className="btn-secondary flex-1">← Back</button>
              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary flex-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Add Money</h1>
      <WalletContent />
    </ProtectedRoute>
  );
}
