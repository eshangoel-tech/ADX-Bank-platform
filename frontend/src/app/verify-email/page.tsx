"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";
export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  // Pre-fill email carried over from the register page
  useEffect(() => {
    const pending = sessionStorage.getItem("adx_pending_email");
    if (pending) setEmail(pending);
  }, []);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/verify-email", { email, otp });
      if (data?.success) {
        sessionStorage.removeItem("adx_pending_email");
        setTimeout(() => router.push("/login"), 800);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="page-title">Verify Email</h1>

      <div className="card">
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
          Check your email for a 6-digit OTP and enter it below.
        </div>

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
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

        <p className="mt-4 text-sm text-gray-500 text-center">
          Verified?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
