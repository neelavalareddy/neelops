"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import type { SessionUser } from "@/lib/auth/session";

type AuthViewer = SessionUser & {
  username?: string | null;
  wallet_address?: string | null;
};

function getUserBadgeLabel(user: AuthViewer): string {
  if (user.role === "admin") {
    return "Admin";
  }

  if (user.username?.trim()) {
    return user.username.trim();
  }

  if (user.wallet_address) {
    return `Wallet ${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
  }

  return "Verified user";
}

export default function NavBar() {
  const [currentUser, setCurrentUser] = useState<AuthViewer | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        setCurrentUser(json?.user ?? null);
      } catch {
        if (active) setCurrentUser(null);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const navLinkStyle = {
    padding: "7px 12px",
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-2)",
    textDecoration: "none",
    transition: "color 0.15s, background 0.15s",
  } as const;

  const userBadgeLabel = currentUser ? getUserBadgeLabel(currentUser) : null;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--border)",
      background: "rgba(11,16,32,0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div
        className="nav-shell"
        style={{
        maxWidth: 1152, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        minHeight: 62, padding: "10px 20px",
        gap: 16,
      }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 22, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
            flex: "0 0 auto",
          }}>
            <BrandLogo size={22} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}>Classify</span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}>Catch hallucinations pre-prod</span>
          </div>
        </Link>

        <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[
            { href: "/agents", label: "Agents" },
            { href: "/tasks", label: "Tasks" },
            { href: "/dashboard", label: "Dashboard" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={navLinkStyle}>
              {label}
            </Link>
          ))}
          {currentUser ? (
            <>
              <div
                style={{
                  marginLeft: 8,
                  padding: "7px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--pass)",
                  background: "rgba(97, 245, 163, 0.08)",
                }}
              >
                {userBadgeLabel}
              </div>
              <form method="POST" action="/api/auth/logout">
                <button
                  type="submit"
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-2)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : null}
          <Link href="/agents/new" className="c-btn-primary" style={{ marginLeft: 8, padding: "7px 14px", fontSize: 12 }}>
            Connect Agent
          </Link>
        </nav>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .nav-shell {
            flex-direction: column;
            align-items: stretch;
            padding: 12px 16px;
          }
          .nav-links {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </header>
  );
}
