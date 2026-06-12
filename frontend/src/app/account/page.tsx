"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface AccountDetails {
  account_number: string;
  account_number_masked: string;
  account_type: string;
  balance: string;
  currency: string;
  status: string;
  created_at: string;
}

function AccountContent() {
  const [data, setData] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get("/account/details")
      .then(({ data: res }) => setData(res?.data ?? res))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (data?.account_number) {
      navigator.clipboard.writeText(data.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
        <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return null;

  const fields = [
    { label: "Account Type", value: data.account_type },
    { label: "Currency", value: data.currency },
    { label: "Status", value: data.status, highlight: data.status === "ACTIVE" ? "emerald" : "red" },
    { label: "Member Since", value: new Date(data.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
  ];

  return (
    <div className="max-w-md space-y-4">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/60 to-slate-900 border border-blue-800/40 p-6 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.15),transparent_70%)]" />
        <div className="relative z-10 space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Current Balance</p>
          <p className="text-4xl font-bold text-white tracking-tight">
            ₹{parseFloat(data.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <p className="text-sm font-mono text-slate-300">{data.account_number_masked}</p>
            <button
              onClick={handleCopy}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card divide-y divide-slate-800 p-0 overflow-hidden">
        {fields.map((f) => (
          <div key={f.label} className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm text-slate-400">{f.label}</span>
            <span className={`text-sm font-semibold ${
              f.highlight === "emerald" ? "text-emerald-400" :
              f.highlight === "red" ? "text-red-400" :
              "text-slate-200"
            }`}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Account Details</h1>
      <AccountContent />
    </ProtectedRoute>
  );
}
