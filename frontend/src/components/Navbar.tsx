"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isLanding = pathname === "/" || pathname === "/landing";

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: scrolled ? "rgba(6, 10, 18, 0.9)" : "rgba(6, 10, 18, 0.6)",
        borderBottom: scrolled
          ? "1px solid var(--border-subtle)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 group"
          aria-label="ADX Bank home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #0e7490 100%)",
              boxShadow: "0 2px 10px var(--accent-glow)",
            }}
          >
            A
          </div>
          <span
            className="font-display font-bold text-lg tracking-tight"
            style={{
              background: "linear-gradient(90deg, var(--text-primary) 0%, var(--accent-hover) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ADX Bank
          </span>
        </Link>

        {/* Right side */}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: "var(--text-secondary)" }}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
                boxShadow: "0 2px 10px var(--accent-glow)",
              }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
