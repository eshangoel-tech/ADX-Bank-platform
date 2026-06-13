"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, getErrorMessage } from "@/services/api";
import { AdxLogo } from "@/components/AdxLogo";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { Spinner } from "@/components/Spinner";

interface DashboardData {
  user: { full_name: string; email: string; phone: string };
  account: {
    account_number_masked: string;
    balance: string;
    account_type: string;
    currency: string;
    status: string;
  };
  recent_transactions: Array<{
    id: string;
    entry_type: string;
    amount: string;
    balance_after: string;
    reference_type: string;
    description: string;
    created_at: string;
  }>;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
function cleanDesc(desc: string, refType: string): string {
  if (!desc) return refType;
  if (UUID_RE.test(desc)) {
    const lower = desc.toLowerCase();
    if (lower.startsWith("transfer to")) return "Outgoing Transfer";
    if (lower.startsWith("transfer from")) return "Incoming Transfer";
    return "Transfer";
  }
  return desc;
}

const FEATURES = [
  {
    href: "/transfer",
    label: "Transfer",
    desc: "Send money instantly",
    accentVar: "--accent",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    href: "/wallet",
    label: "Add Money",
    desc: "Top up your balance",
    accentVar: "--success",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: "/loans",
    label: "Loans",
    desc: "Simulate or apply",
    accentVar: "--warning",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    href: "/assistant",
    label: "AI Assistant",
    desc: "Ask anything",
    accentVar: "--gold",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    desc: "Full history",
    accentVar: "--accent",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/requests",
    label: "Request Money",
    desc: "Ask someone to pay",
    accentVar: "--warning",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account & Profile",
    desc: "Details & settings",
    accentVar: "--text-secondary",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased * 100) / 100);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return count;
}

function WelcomeOverlay({ name }: { name: string }) {
  return (
    <motion.div
      key="welcome-overlay"
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)", zIndex: 100 }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
          className="mx-auto w-fit"
        >
          <AdxLogo size={80} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-xs uppercase tracking-[0.2em] font-semibold"
          style={{ color: "var(--text-tertiary)" }}
        >
          Welcome back
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold"
          style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)", color: "var(--text-primary)" }}
        >
          {name || "Loading…"}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
          className="mx-auto h-0.5 w-16 rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
        />
      </div>
    </motion.div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem("adx_show_welcome");
    if (flag) {
      sessionStorage.removeItem("adx_show_welcome");
      setShowWelcome(true);
      const t = setTimeout(() => setShowWelcome(false), 2600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(({ data: res }) => setData(res?.data ?? res))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const balance = data ? parseFloat(data.account.balance) : 0;
  const animatedBalance = useCountUp(balance, 1000);

  const firstName = data?.user?.full_name?.split(" ")[0] ?? "";

  if (loading && !showWelcome) {
    return (
      <div className="flex items-center justify-center py-24 gap-3" style={{ color: "var(--text-secondary)" }}>
        <Spinner size={20} />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    );
  }

  if (error) return <div className="error-box">{error}</div>;

  return (
    <>
      <AnimatePresence>
        {showWelcome && <WelcomeOverlay name={firstName} />}
      </AnimatePresence>
    <PageTransition>
      <div className="space-y-8">

        {/* Balance hero card */}
        {data && (
          <div
            className="balance-card relative overflow-hidden rounded-2xl border p-6 shadow-2xl"
            style={{ borderColor: "var(--border-default)" }}
          >
            {/* Glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(8,145,178,0.08) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--text-tertiary)" }}>
                Good to see you back
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                    Available Balance
                  </p>
                  <p
                    className="font-display font-bold tracking-tight"
                    style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)", color: "var(--gold)" }}
                  >
                    ₹{animatedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm mt-2 font-mono" style={{ color: "var(--text-tertiary)" }}>
                    {data.account.account_number_masked}
                  </p>
                </div>
                <div className="text-right shrink-0 min-w-0 max-w-[45%]">
                  <p className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {data.user.full_name}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
                    {data.user.email}
                  </p>
                  <span
                    className="mt-2 inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={
                      data.account.status === "ACTIVE"
                        ? { background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }
                        : { background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }
                    }
                  >
                    {data.account.status}
                  </span>
                </div>
              </div>
              <div
                className="mt-4 pt-4 flex gap-4 text-xs"
                style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}
              >
                <span>{data.account.account_type}</span>
                <span>·</span>
                <span>{data.account.currency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Feature grid */}
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--text-tertiary)" }}>
            Quick Actions
          </p>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" staggerMs={50}>
            {FEATURES.map((f) => (
              <StaggerItem key={f.href}>
                <motion.button
                  onClick={() => router.push(f.href)}
                  className="group w-full text-left p-4 rounded-xl cursor-pointer transition-colors duration-200"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px var(--accent-glow)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                    style={{
                      backgroundColor: "var(--accent-muted)",
                      color: `var(${f.accentVar})`,
                    }}
                  >
                    {f.icon}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {f.label}
                  </p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: "var(--text-tertiary)" }}>
                    {f.desc}
                  </p>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Recent transactions */}
        {data && data.recent_transactions.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                Recent Transactions
              </h2>
              <button
                onClick={() => router.push("/transactions")}
                className="text-xs transition-colors duration-150 cursor-pointer"
                style={{ color: "var(--accent)" }}
              >
                View all →
              </button>
            </div>
            <StaggerContainer staggerMs={60}>
              {data.recent_transactions.slice(0, 5).map((tx) => (
                <StaggerItem key={tx.id}>
                  <div
                    className="py-3 flex justify-between items-center"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Directional icon — shape + color for accessibility */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            tx.entry_type === "CREDIT"
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(239,68,68,0.1)",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          style={{ color: tx.entry_type === "CREDIT" ? "var(--success)" : "var(--danger)" }}
                        >
                          {tx.entry_type === "CREDIT" ? (
                            /* Arrow pointing up-right = credit received */
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l16-16M20 4H8M20 4v12" />
                          ) : (
                            /* Arrow pointing down-left = debit sent */
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4L4 20M4 20h12M4 20V8" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {cleanDesc(tx.description, tx.reference_type)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{ color: tx.entry_type === "CREDIT" ? "var(--success)" : "var(--danger)" }}
                      >
                        {tx.entry_type === "CREDIT" ? "+" : "−"}₹
                        {parseFloat(tx.amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        Bal: ₹{parseFloat(tx.balance_after).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}
      </div>
    </PageTransition>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
