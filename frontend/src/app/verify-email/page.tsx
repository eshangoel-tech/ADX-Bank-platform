"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";
import { AdxLogo } from "@/components/AdxLogo";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem("adx_pending_email");
    if (pending) setEmail(pending);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/verify-email", { email, otp });
      const d = data?.data ?? data;
      if (data?.success && d?.setup_token) {
        sessionStorage.removeItem("adx_pending_email");
        // Store setup_token for the PIN setup page
        sessionStorage.setItem("adx_setup_token", d.setup_token);
        setSuccess(true);
        setTimeout(() => router.push("/setup-pin"), 800);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Verify Your Email</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Enter the 6-digit OTP sent to your registered email.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <AdxLogo size={64} />
            <div>
              <p className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>ADX Bank</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>AI-Powered Digital Banking</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-4 py-2.5"
              style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Email verified! Setting up your PIN…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
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
                required
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "var(--danger)", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }} />
                  Verifying…
                </span>
              ) : "Verify Email →"}
            </button>

            <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
              Already verified?{" "}
              <Link href="/login" style={{ color: "var(--accent)" }}>Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
