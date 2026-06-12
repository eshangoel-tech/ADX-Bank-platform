"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function VerifyLoginPage() {
  const [identifier, setIdentifier] = useState("");

  // Pre-fill the identifier stored by the login page so the user doesn't retype it
  useEffect(() => {
    const pending = sessionStorage.getItem("adx_pending_identifier");
    if (pending) setIdentifier(pending);
  }, []);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/verify-login-otp", {
        identifier,
        otp,
      });

      // Backend returns { success, data: { access_token, session_id, ... } }
      const payload = data?.data ?? data;
      const token = payload?.access_token;
      const sessionId = payload?.session_id ?? "";

      if (token) {
        sessionStorage.removeItem("adx_pending_identifier");
        login(token, sessionId);
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
      <h1 className="page-title">Verify Login OTP</h1>

      <div className="card">
        <p className="text-sm text-gray-500 mb-4">
          Enter the OTP sent to your registered email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email or Phone</label>
            <input
              className="input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Same identifier used at login"
              required
            />
          </div>
          <div>
            <label className="label">OTP (6 digits)</label>
            <input
              className="input"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
      </div>
    </div>
  );
}
