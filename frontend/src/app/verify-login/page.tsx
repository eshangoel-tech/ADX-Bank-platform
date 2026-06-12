"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { PinInput } from "@/components/PinInput";

type LoginMode = "otp" | "pin";

export default function VerifyLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [mode, setMode] = useState<LoginMode>("otp");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("adx_pending_identifier") ?? "";
    const pw = sessionStorage.getItem("adx_pending_password") ?? "";
    const hp = sessionStorage.getItem("adx_has_pin") === "true";
    setIdentifier(id);
    setPassword(pw);
    setHasPin(hp);
    if (hp) setMode("pin");
  }, []);

  const clearSession = () => {
    sessionStorage.removeItem("adx_pending_identifier");
    sessionStorage.removeItem("adx_pending_password");
    sessionStorage.removeItem("adx_has_pin");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/verify-login-otp", { identifier, otp });
      const payload = data?.data ?? data;
      if (payload?.access_token) {
        clearSession();
        login(payload.access_token, payload.session_id ?? "");
        router.push("/dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) { setError("Enter all 6 digits."); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login-pin", { identifier, password, pin });
      const payload = data?.data ?? data;
      if (payload?.access_token) {
        clearSession();
        login(payload.access_token, payload.session_id ?? "");
        router.push("/dashboard");
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
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Verify Identity</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {mode === "pin" ? "Enter your 6-digit ADX PIN to continue." : "Enter the OTP sent to your email."}
          </p>
        </div>

        {/* Mode toggle — only show if user has PIN */}
        {hasPin && (
          <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            {(["pin", "otp"] as LoginMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setOtp(""); setPin(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
                style={
                  mode === m
                    ? { backgroundColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px var(--accent-glow)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {m === "pin" ? "Use PIN" : "Use OTP"}
              </button>
            ))}
          </div>
        )}

        {mode === "otp" ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
              style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--border-default)" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--accent)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--accent-hover)" }}>OTP sent to your registered email.</p>
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
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }} />Verifying…</span> : "Verify & Login →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <PinInput value={pin} onChange={setPin} autoFocus />

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg text-center" style={{ color: "var(--danger)", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || pin.length < 6} className="btn-primary w-full">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }} />Logging in…</span> : "Login with PIN →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
