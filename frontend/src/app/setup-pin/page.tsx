"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PinInput } from "@/components/PinInput";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export default function SetupPinPage() {
  const router = useRouter();
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("adx_setup_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setSetupToken(token);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) { setError("PIN must be 6 digits."); return; }
    if (pin !== confirmPin) { setError("PINs do not match."); return; }
    setLoading(true);
    setError(null);
    try {
      await axios.post(
        `${API_BASE}/user/pin/setup`,
        { new_pin: pin, confirm_pin: confirmPin },
        { headers: { Authorization: `Bearer ${setupToken}` } }
      );
      sessionStorage.removeItem("adx_setup_token");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message ?? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!setupToken) return null;

  return (
    <div className="max-w-sm mx-auto">
      <div className="card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, #0e7490 100%)", boxShadow: "0 4px 20px var(--accent-glow)" }}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Set Your 6-Digit PIN</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This PIN will be used for transfers and adding money. Keep it secret.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.1)" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--success)" }}>PIN set! Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: "var(--text-tertiary)" }}>New PIN</label>
              <PinInput value={pin} onChange={setPin} autoFocus />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: "var(--text-tertiary)" }}>Confirm PIN</label>
              <PinInput value={confirmPin} onChange={setConfirmPin} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg text-center" style={{ color: "var(--danger)", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 6 || confirmPin.length < 6}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }} />
                  Setting PIN…
                </span>
              ) : "Set PIN & Continue →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
