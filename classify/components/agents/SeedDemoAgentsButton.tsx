"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SeedDemoAgentsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Could not add demo agents.");
        return;
      }

      const insertedAgents =
        typeof json?.agents_inserted === "number"
          ? json.agents_inserted
          : typeof json?.agents === "number"
            ? json.agents
            : 0;

      setMessage(
        insertedAgents > 0
          ? `Added ${insertedAgents} demo agent${insertedAgents === 1 ? "" : "s"}.`
          : "Demo agents were already available."
      );
      router.refresh();
    } catch {
      setError("Could not add demo agents.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <button
        type="button"
        onClick={seed}
        disabled={loading}
        className="c-btn-ghost"
        style={{ flexShrink: 0, padding: "9px 18px", fontSize: 12 }}
      >
        {loading ? "Adding demos…" : "Add demo agents"}
      </button>
      {message ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--pass)" }}>{message}</div>
      ) : null}
      {error ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fail)" }}>{error}</div>
      ) : null}
    </div>
  );
}
