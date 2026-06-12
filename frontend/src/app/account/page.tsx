"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PinInput } from "@/components/PinInput";
import { Spinner } from "@/components/Spinner";

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
  salary?: string;
  address?: { city?: string; state?: string };
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function AccountContent() {
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile edit
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change PIN
  const [pinOtp, setPinOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinChanging, setPinChanging] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/account/details"), api.get("/user/profile")])
      .then(([accRes, profRes]) => {
        const acc = accRes.data?.data ?? accRes.data;
        const prof = profRes.data?.data ?? profRes.data;
        setAccount(acc);
        setProfile(prof);
        setPhone(prof?.phone ?? "");
        setCity(prof?.address?.city ?? "");
        setProfileState(prof?.address?.state ?? "");
        setSalary(prof?.salary ? String(prof.salary) : "");
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
        ...(salary ? { salary: parseFloat(salary) } : {}),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      await api.post("/user/pin/request-otp");
      setOtpSent(true);
    } catch (err) {
      setOtpError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) { setPinError("PINs do not match."); return; }
    if (newPin.length < 6) { setPinError("PIN must be 6 digits."); return; }
    setPinChanging(true);
    setPinError(null);
    try {
      await api.post("/user/pin/change", { otp: pinOtp, new_pin: newPin, confirm_pin: confirmPin });
      setPinSuccess(true);
      setPinOtp(""); setNewPin(""); setConfirmPin("");
      setTimeout(() => { setPinSuccess(false); setOtpSent(false); }, 3000);
    } catch (err) {
      setPinError(getErrorMessage(err));
    } finally {
      setPinChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24" style={{ color: "var(--text-secondary)" }}>
        <Spinner size={20} /> Loading…
      </div>
    );
  }
  if (error) return <div className="error-box">{error}</div>;
  if (!account) return null;

  const accountFields = [
    { label: "Account Type", value: account.account_type },
    { label: "Currency", value: account.currency },
    { label: "Status", value: account.status, color: account.status === "ACTIVE" ? "var(--success)" : "var(--danger)" },
    { label: "Member Since", value: new Date(account.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
  ];

  return (
    <div className="max-w-lg space-y-6">

      {/* ── Account card ── */}
      <div className="card" style={{ background: "linear-gradient(135deg, #0f1829 0%, #0c1220 100%)" }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-tertiary)" }}>Account Balance</p>
            <p className="font-display text-3xl font-bold mt-1" style={{ color: "var(--gold)" }}>
              ₹{parseFloat(account.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, #0e7490 100%)", boxShadow: "0 2px 12px var(--accent-glow)" }}>
            A
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>Account Number</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
              {revealed ? account.account_number : (account.account_number_masked ?? "ADX••••••••")}
            </span>
            <button onClick={() => setRevealed(v => !v)}
              className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors"
              style={{ color: "var(--accent)", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-elevated)" }}>
              {revealed ? "Hide" : "Reveal"}
            </button>
            <button onClick={handleCopy}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              style={{
                color: copied ? "var(--success)" : "var(--accent)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--border-default)"}`,
                backgroundColor: copied ? "rgba(16,185,129,0.08)" : "var(--bg-elevated)",
              }}>
              {copied
                ? <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied</>
                : <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>}
            </button>
          </div>
        </div>
      </div>

      {/* Account detail rows */}
      <div className="card divide-y p-0 overflow-hidden" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
        {accountFields.map((f) => (
          <div key={f.label} className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{f.label}</span>
            <span className="text-sm font-semibold" style={{ color: f.color ?? "var(--text-primary)" }}>{f.value}</span>
          </div>
        ))}
      </div>

      {/* ── Profile ── */}
      <Section title="Profile" subtitle="Name and email cannot be changed.">
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

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <input className="input" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" maxLength={10} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide font-semibold block mb-2" style={{ color: "var(--text-tertiary)" }}>Address</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <input className="input" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" type="text" value={profileState} onChange={(e) => setProfileState(e.target.value)} placeholder="Maharashtra" />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Monthly Salary (INR)</label>
            <input className="input" type="number" min="0" step="1" value={salary}
              onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 75000" />
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Used to compute loan eligibility. Optional.</p>
          </div>

          {saveError && <p className="error-box">{saveError}</p>}
          {saveSuccess && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Profile updated.</p>
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary w-full cursor-pointer">
            {saving ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Saving…</span> : "Save Profile"}
          </button>
        </form>
      </Section>

      {/* ── Change PIN ── */}
      <Section title="Change PIN" subtitle="Verify your identity with an OTP before setting a new PIN.">
        {pinSuccess ? (
          <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--success)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium" style={{ color: "var(--success)" }}>PIN changed successfully!</p>
          </div>
        ) : !otpSent ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Click below to receive an OTP on your registered email to verify the PIN change.
            </p>
            {otpError && <p className="error-box">{otpError}</p>}
            <button onClick={handleRequestOtp} disabled={otpLoading} className="btn-secondary w-full cursor-pointer">
              {otpLoading ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Sending OTP…</span> : "Send OTP to Email"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePin} className="space-y-5">
            <div>
              <label className="label">OTP from Email</label>
              <input className="input tracking-[0.5em] text-center text-lg font-bold font-mono" type="text"
                value={pinOtp} onChange={(e) => setPinOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •" maxLength={6} autoFocus required />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: "var(--text-tertiary)" }}>New PIN</label>
              <PinInput value={newPin} onChange={setNewPin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: "var(--text-tertiary)" }}>Confirm New PIN</label>
              <PinInput value={confirmPin} onChange={setConfirmPin} />
            </div>
            {pinError && <p className="error-box text-center">{pinError}</p>}
            <button type="submit" disabled={pinChanging || pinOtp.length < 6 || newPin.length < 6 || confirmPin.length < 6}
              className="btn-primary w-full cursor-pointer">
              {pinChanging ? <span className="flex items-center justify-center gap-2"><Spinner size={16} />Updating PIN…</span> : "Update PIN"}
            </button>
          </form>
        )}
      </Section>

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
