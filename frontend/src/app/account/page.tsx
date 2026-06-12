"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";

interface AccountDetails {
  account_number: string;
  account_number_masked: string;
  account_type: string;
  balance: string;
  currency: string;
  status: string;
  created_at: string;
}

interface ProfileDetails {
  full_name: string;
  email: string;
  phone: string;
  address?: { city?: string; state?: string };
}

function AccountContent() {
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Account number reveal toggle
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile edit state
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/account/details"),
      api.get("/user/profile"),
    ])
      .then(([accRes, profRes]) => {
        const acc = accRes.data?.data ?? accRes.data;
        const prof = profRes.data?.data ?? profRes.data;
        setAccount(acc);
        setProfile(prof);
        setPhone(prof?.phone ?? "");
        setCity(prof?.address?.city ?? "");
        setProfileState(prof?.address?.state ?? "");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (account?.account_number) {
      navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.put("/user/profile", {
        phone,
        address: { city, state: profileState },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-24 justify-center" style={{ color: "var(--text-secondary)" }}>
        <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        Loading…
      </div>
    );
  }

  if (error) return <div className="error-box">{error}</div>;
  if (!account) return null;

  const accountFields = [
    { label: "Account Type", value: account.account_type },
    { label: "Currency", value: account.currency },
    {
      label: "Status",
      value: account.status,
      color: account.status === "ACTIVE" ? "var(--success)" : "var(--danger)",
    },
    {
      label: "Member Since",
      value: new Date(account.created_at).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      }),
    },
  ];

  return (
    <div className="max-w-lg space-y-6">

      {/* ── Account card ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(8,145,178,0.12) 0%, var(--bg-card) 60%)",
          borderColor: "var(--border-default)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(8,145,178,0.08) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-tertiary)" }}>
            Current Balance
          </p>
          <p className="font-display font-bold tracking-tight" style={{ fontSize: "clamp(2rem,5vw,2.5rem)", color: "var(--gold)" }}>
            ₹{parseFloat(account.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>

          {/* Account number row */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Account Number</p>
              <p className="text-sm font-mono font-semibold tracking-wider" style={{ color: "var(--text-primary)" }}>
                {revealed ? account.account_number : account.account_number_masked}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRevealed((v) => !v)}
                className="text-xs px-2.5 py-1 rounded-lg transition-colors duration-150 cursor-pointer"
                style={{
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-elevated)",
                }}
              >
                {revealed ? "Hide" : "Reveal"}
              </button>
              <button
                onClick={handleCopy}
                className="text-xs px-2.5 py-1 rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1"
                style={{
                  color: copied ? "var(--success)" : "var(--accent)",
                  border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--border-default)"}`,
                  backgroundColor: copied ? "rgba(16,185,129,0.08)" : "var(--bg-elevated)",
                }}
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account details rows */}
      <div className="card divide-y p-0 overflow-hidden" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
        {accountFields.map((f) => (
          <div key={f.label} className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{f.label}</span>
            <span className="text-sm font-semibold" style={{ color: f.color ?? "var(--text-primary)" }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Profile section ───────────────────────────────────────────── */}
      <div className="card space-y-5">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Profile</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Your personal details. Name and email cannot be changed.
          </p>
        </div>

        {/* Read-only identity */}
        <div className="rounded-xl divide-y overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          {[
            { label: "Full Name", value: profile?.full_name ?? "—" },
            { label: "Email", value: profile?.email ?? "—" },
          ].map((row) => (
            <div key={row.label} className="px-4 py-3 flex justify-between items-center">
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Editable fields */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              maxLength={10}
            />
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wide font-semibold mb-3 block" style={{ color: "var(--text-tertiary)" }}>
              Address
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  className="input"
                  type="text"
                  value={profileState}
                  onChange={(e) => setProfileState(e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "var(--danger)", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Profile updated successfully.</p>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }} />
                Saving…
              </span>
            ) : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <PageTransition>
        <h1 className="page-title">Account & Profile</h1>
        <AccountContent />
      </PageTransition>
    </ProtectedRoute>
  );
}
