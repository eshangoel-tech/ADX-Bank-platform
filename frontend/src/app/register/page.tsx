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
  address: string;
  salary: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
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
        ...form,
        salary: form.salary ? parseFloat(form.salary) : undefined,
      });
      // On success, carry the email to the verify-email page
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

  return (
    <div className="max-w-md mx-auto">
      <h1 className="page-title">Register</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            [
              { name: "full_name", label: "Full Name", type: "text" },
              { name: "email", label: "Email", type: "email" },
              { name: "phone", label: "Phone", type: "text" },
              { name: "password", label: "Password", type: "password" },
              { name: "address", label: "Address", type: "text" },
              { name: "salary", label: "Salary (INR)", type: "number" },
            ] as const
          ).map(({ name, label, type }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input
                className="input"
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={label}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400 bg-red-900/10 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

        <p className="mt-4 text-sm text-gray-500 text-center">
          Already registered?{" "}
          <Link href="/verify-email" className="text-blue-600 hover:underline">
            Verify email
          </Link>{" "}
          or{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
