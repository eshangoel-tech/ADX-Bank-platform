"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function ProfileContent() {
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill from GET /user/profile
  useEffect(() => {
    api
      .get("/user/profile")
      .then(({ data }) => {
        const d = data?.data ?? data;
        if (d.phone) setPhone(d.phone);
        if (d.address?.city) setCity(d.address.city);
        if (d.address?.state) setState(d.address.state);
      })
      .catch(() => {/* non-critical, just skip pre-fill */})
      .finally(() => setFetchLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.put("/user/profile", {
        phone,
        address: { city, state },
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
        <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="card space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-100">Update Profile</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Update your phone number or address.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
            />
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Address</p>
            <div className="space-y-3">
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
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-400 font-medium">Profile updated successfully.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Edit Profile</h1>
      <ProfileContent />
    </ProtectedRoute>
  );
}
