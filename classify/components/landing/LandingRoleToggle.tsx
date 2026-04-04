"use client";

import Link from "next/link";
import { useState } from "react";

type Role = "worker" | "company";

const COPY: Record<
  Role,
  { lines: string[]; primary: { href: string; label: string }; secondary: { href: string; label: string } }
> = {
  worker: {
    lines: ["Pick open tasks on the board.", "Verify once with World ID per task.", "Rate, write feedback, earn WLD."],
    primary: { href: "/tasks", label: "Start earning WLD →" },
    secondary: { href: "/post", label: "I’m posting instead" },
  },
  company: {
    lines: ["Paste model output and criteria.", "Set a WLD bounty per human review.", "Get structured scores and comments."],
    primary: { href: "/post", label: "Post a task →" },
    secondary: { href: "/tasks", label: "Browse the board" },
  },
};

export default function LandingRoleToggle() {
  const [role, setRole] = useState<Role>("worker");
  const c = COPY[role];

  return (
    <div className="space-y-6">
      <div
        className="inline-flex rounded-xl p-1 gap-0.5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
        }}
        role="tablist"
        aria-label="Choose your path"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "worker"}
          className="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
          style={{
            fontFamily: "var(--font-mono)",
            background: role === "worker" ? "var(--gold-dim)" : "transparent",
            color: role === "worker" ? "var(--gold)" : "var(--text-muted)",
            border: role === "worker" ? "1px solid var(--gold-border)" : "1px solid transparent",
          }}
          onClick={() => setRole("worker")}
        >
          I earn WLD
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "company"}
          className="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
          style={{
            fontFamily: "var(--font-mono)",
            background: role === "company" ? "var(--signal-dim)" : "transparent",
            color: role === "company" ? "var(--signal)" : "var(--text-muted)",
            border: role === "company" ? "1px solid var(--signal-border)" : "1px solid transparent",
          }}
          onClick={() => setRole("company")}
        >
          I need feedback
        </button>
      </div>

      <p
        key={role}
        className="hero-sub"
      >
        {c.lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href={c.primary.href} className="c-btn-primary px-7 py-3.5 text-sm">
          {c.primary.label}
        </Link>
        <Link href={c.secondary.href} className="c-btn-ghost px-7 py-3.5 text-sm">
          {c.secondary.label}
        </Link>
      </div>
    </div>
  );
}
