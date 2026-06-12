"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = () => {
      api.get("/notifications/unread-count")
        .then(({ data }) => setUnread(data?.data?.count ?? data?.count ?? 0))
        .catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  // Instantly clear badge when user is on the notifications page
  useEffect(() => {
    if (pathname === "/notifications") setUnread(0);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isLanding = pathname === "/" || pathname === "/landing";
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/verify") ||
    pathname === "/setup-pin";
  const isDashboard = pathname === "/dashboard";
  const showBack = isAuthenticated && !isDashboard && !isLanding && !isAuthPage;

  const iconBtn =
    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 relative";

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
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-2">

        {/* Back button */}
        {showBack && (
          <button
            onClick={() => router.push("/dashboard")}
            className={iconBtn}
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
            aria-label="Back to dashboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 group flex-1"
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
          <div className="flex items-center gap-1">

            {/* Notification bell */}
            <Link
              href="/notifications"
              className={iconBtn}
              style={{ color: "var(--text-secondary)" }}
              aria-label="Notifications"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold px-1"
                  style={{ fontSize: "10px", lineHeight: 1, backgroundColor: "#ef4444", boxShadow: "0 0 0 2px rgba(6,10,18,0.9)" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              href="/account"
              className={iconBtn}
              style={{ color: "var(--text-secondary)" }}
              aria-label="Account & Profile"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`${iconBtn} ml-0.5`}
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--danger)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
              aria-label="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: "var(--text-secondary)" }}>
              Login
            </Link>
            <Link href="/register" className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{ backgroundColor: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px var(--accent-glow)" }}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
