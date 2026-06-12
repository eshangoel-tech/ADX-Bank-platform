"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";

const GITHUB_REPO = "https://github.com/eshangoel-tech/ADX-Bank-platform";
const LINKEDIN_URL = "https://www.linkedin.com/in/eshan-goel-7a8885218/";

// ── Data ──────────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    id: "user",
    label: "User Message",
    desc: "Natural language query enters the system",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: "router",
    label: "Router Agent",
    desc: "Analyses intent, splits into sub-queries, assigns context",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    ),
  },
  {
    id: "agents",
    label: "Domain Agents (parallel)",
    desc: "Bank Manager · Loan Officer · Accountant · Support — run concurrently via asyncio.gather",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    parallel: true,
  },
  {
    id: "receptionist",
    label: "Receptionist",
    desc: "Merges responses, deduplicates actions, produces coherent reply",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    title: "3-Layer Multi-Agent AI",
    desc: "Router → 4 parallel specialists → Receptionist. Every query gets the right expert.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accent: "var(--accent)",
  },
  {
    title: "LLM Fallback Chain",
    desc: "Groq → OpenAI → Claude. If one provider fails, the next takes over with zero downtime.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    accent: "var(--success)",
  },
  {
    title: "RAG Knowledge Base",
    desc: "ChromaDB with ONNX embeddings. Bank policies and rules retrieved at query time.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    accent: "var(--warning)",
  },
  {
    title: "OTP-Secured Transactions",
    desc: "Every transfer, loan, and wallet top-up requires OTP verification via email.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    accent: "var(--danger)",
  },
  {
    title: "Real-time EMI Simulator",
    desc: "Instant loan calculations with a principal-vs-interest breakdown. No page refresh.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    accent: "var(--accent)",
  },
  {
    title: "Background Task Engine",
    desc: "Celery + Redis handles async OTP emails and scheduled jobs, decoupled from the API.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    accent: "var(--success)",
  },
];

const TECH_STACK = [
  { name: "Next.js 14", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "FastAPI", category: "Backend" },
  { name: "Python 3.12", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Redis", category: "Cache" },
  { name: "Celery", category: "Tasks" },
  { name: "ChromaDB", category: "Vector DB" },
  { name: "Docker", category: "DevOps" },
  { name: "SQLAlchemy", category: "ORM" },
  { name: "Alembic", category: "Migrations" },
];

// ── Pipeline section ──────────────────────────────────────────────────────────
function PipelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  return (
    <section ref={ref} className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--accent)" }}>Architecture</p>
          <h2 className="font-display text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            How the AI brain works
          </h2>
          <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            A query doesn't go to a single model. It flows through three specialized layers.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-0">
          {PIPELINE_STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              className="flex-1 flex flex-col items-center"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Connector */}
              <div className="flex items-center w-full">
                {i > 0 && (
                  <motion.div
                    className="flex-1 h-0.5 hidden md:block"
                    style={{ backgroundColor: "var(--border-default)" }}
                    initial={reduced ? false : { scaleX: 0, originX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.3, delay: i * 0.12 + 0.1 }}
                  />
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto shrink-0"
                  style={{
                    backgroundColor: step.parallel ? "var(--gold-muted)" : "var(--accent-muted)",
                    color: step.parallel ? "var(--gold)" : "var(--accent)",
                    border: `1px solid ${step.parallel ? "rgba(201,168,76,0.25)" : "var(--border-default)"}`,
                  }}
                >
                  {step.icon}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 hidden md:block" style={{ backgroundColor: "var(--border-default)" }} />
                )}
              </div>

              {/* Label */}
              <div className="mt-4 text-center px-2">
                <p className="text-sm font-semibold" style={{ color: step.parallel ? "var(--gold)" : "var(--text-primary)" }}>
                  {step.label}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                  {step.desc}
                </p>
              </div>

              {/* Parallel indicator */}
              {step.parallel && (
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map((j) => (
                    <motion.div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--gold)" }}
                      animate={reduced ? {} : { opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features section ──────────────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <section ref={ref} className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--accent)" }}>Capabilities</p>
          <h2 className="font-display text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Built for production, not prototypes
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-2xl p-5 cursor-pointer"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={reduced ? {} : {
                y: -6,
                scale: 1.02,
                borderColor: f.accent,
                boxShadow: `0 12px 36px rgba(0,0,0,0.25), 0 0 0 1px ${f.accent}22`,
                transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
              }}
            >
              <motion.div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--accent-muted)", color: f.accent }}
                whileHover={reduced ? {} : { scale: 1.1, backgroundColor: `${f.accent}22` }}
                transition={{ duration: 0.2 }}
              >
                {f.icon}
              </motion.div>
              <h3 className="font-display text-base font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const reduced = useReducedMotion();
  const [starToast, setStarToast] = useState(false);

  const handleGitHub = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setStarToast(true);
    setTimeout(() => {
      setStarToast(false);
      window.open(GITHUB_REPO, "_blank", "noopener,noreferrer");
    }, 1200);
  };

  return (
    <div className="min-h-screen" style={{ paddingTop: "0" }}>

      {/* ── Star toast ── */}
      <AnimatePresence>
        {starToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 z-[100] px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl whitespace-nowrap"
            style={{ left: "50%", backgroundColor: "#1c1f2e", border: "1px solid rgba(245,158,11,0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#fbbf24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div>
              <p className="text-sm font-bold" style={{ color: "#fbbf24" }}>If you liked it, give a star!</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Redirecting to GitHub…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 overflow-hidden">
        {/* Background glow — signature element */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(8,145,178,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Node network hint — subtle absolute circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {[[15,20],[85,35],[10,65],[90,70],[50,85],[30,45],[70,20]].map(([x,y], i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, backgroundColor: "var(--accent)", opacity: 0.25 }}
              animate={reduced ? {} : { opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 max-w-3xl"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-hover)", border: "1px solid var(--border-default)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
            Multi-agent AI · Production-ready stack
          </div>

          <h1
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", color: "var(--text-primary)" }}
          >
            Banking with{" "}
            <span
              style={{
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              an AI brain
            </span>
          </h1>

          <p className="text-lg leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            A full-stack digital banking platform where three layers of specialized AI agents work in parallel to understand, reason about, and respond to every financial query.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
                boxShadow: "0 4px 18px var(--accent-glow)",
              }}
            >
              Try the demo →
            </Link>
            <a
              href={GITHUB_REPO}
              onClick={handleGitHub}
              className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Star on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div style={{ height: "1px", backgroundColor: "var(--border-subtle)" }} />
      </div>

      {/* Pipeline */}
      <PipelineSection />

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div style={{ height: "1px", backgroundColor: "var(--border-subtle)" }} />
      </div>

      {/* Features */}
      <FeaturesSection />

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div style={{ height: "1px", backgroundColor: "var(--border-subtle)" }} />
      </div>

      {/* Tech stack */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-semibold text-center mb-8" style={{ color: "var(--text-tertiary)" }}>
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TECH_STACK.map((t) => (
              <span
                key={t.name}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {t.name}
                <span className="ml-1.5 text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                  {t.category}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Built by{" "}
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
              className="font-semibold transition-colors duration-150"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#0a66c2"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}>
              Eshan Goel
            </a>
          </p>
          <div className="flex items-center gap-4">
            <a
              href={GITHUB_REPO}
              onClick={handleGitHub}
              className="transition-colors duration-150 cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="GitHub"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-150 cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="LinkedIn"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#0a66c2"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
