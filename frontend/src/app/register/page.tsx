"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/services/api";

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  state: string;
  salary: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    state: "",
    salary: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        salary: form.salary ? parseFloat(form.salary) : undefined,
        address: (form.city || form.state)
          ? { city: form.city || undefined, state: form.state || undefined }
          : undefined,
      });
      if (data?.success) {
        sessionStorage.setItem("adx_pending_email", form.email);
        setTimeout(() => router.push("/verify-email"), 800);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const topFields = [
    { name: "full_name" as const, label: "Full Name", type: "text", placeholder: "Eshan Goel" },
    { name: "email" as const, label: "Email", type: "email", placeholder: "you@email.com" },
    { name: "phone" as const, label: "Phone", type: "text", placeholder: "9876543210" },
    { name: "password" as const, label: "Password", type: "password", placeholder: "Min 8 characters" },
  ];

  return (
    <div className="max-w-md mx-auto">
      <h1 className="page-title">Register</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">

          {topFields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input
                className="input"
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Address — City + State side by side */}
          <div>
            <label className="text-xs uppercase tracking-wide font-semibold block mb-2" style={{ color: "var(--text-tertiary)" }}>
              Address <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Delhi"
                />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  className="input"
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Delhi"
                />
              </div>
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="label">Monthly Salary (INR) <span className="text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>optional</span></label>
            <input
              className="input"
              type="number"
              name="salary"
              min="0"
              value={form.salary}
              onChange={handleChange}
              placeholder="e.g. 75000"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Used to calculate loan eligibility.</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
            {loading ? "Registering…" : "Create Account"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

        <p className="mt-4 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
          Already registered?{" "}
          <Link href="/verify-email" className="hover:underline" style={{ color: "var(--accent)" }}>
            Verify email
          </Link>{" "}
          or{" "}
          <Link href="/login" className="hover:underline" style={{ color: "var(--accent)" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
