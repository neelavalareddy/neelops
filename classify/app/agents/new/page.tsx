"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export default function NewAgentPage() {
  const router = useRouter();
  const [company_name, setCompany] = useState("");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [rules, setRules] = useState("");
  const [persona, setPersona] = useState("");
  const [bounty_wld, setBounty] = useState("0.50");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const bounty = parseFloat(bounty_wld);
    if (isNaN(bounty) || bounty <= 0) {
      setError("Enter a valid WLD bounty.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: company_name.trim(),
        name: name.trim(),
        objective: objective.trim(),
        rules: rules.trim(),
        persona: persona.trim() || null,
        bounty_wld: bounty,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof j?.error === "string" ? j.error : "Failed to list agent.");
      setLoading(false);
      return;
    }
    const id = j.agent?.id;
    if (id) router.push(`/agents/${id}`);
    else router.push("/agents");
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <div className="mb-8">
          <div className="c-pill mb-3">For companies</div>
          <h1 className="font-display text-5xl text-white tracking-wider leading-none mb-2">LIST AN AGENT</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Define what testers should accomplish and what they must not do. Classify evaluates their messages before you pay.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,69,84,0.3)", color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div>
              <label className="c-label">Company / team</label>
              <input className="c-input" value={company_name} onChange={(e) => setCompany(e.target.value)} required placeholder="Acme AI" />
            </div>
            <div>
              <label className="c-label">Agent name</label>
              <input className="c-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Refund helper v2" />
            </div>
            <div>
              <label className="c-label">Objective (what testers should achieve in chat)</label>
              <textarea
                className="c-input resize-none"
                rows={4}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                required
                placeholder="e.g. Successfully request a refund for a digital order without providing a real order ID (edge case)."
              />
            </div>
            <div>
              <label className="c-label">Rules (hard constraints for testers)</label>
              <textarea
                className="c-input resize-none"
                rows={4}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                required
                placeholder="No profanity; no asking the model to ignore policies; no sharing real PII…"
              />
            </div>
            <div>
              <label className="c-label">Persona (optional — how the agent should sound)</label>
              <input
                className="c-input"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Friendly support tone, short answers"
              />
            </div>
            <div>
              <label className="c-label">Bounty (WLD) if Classify approves the session</label>
              <input className="c-input" type="text" inputMode="decimal" value={bounty_wld} onChange={(e) => setBounty(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="c-btn-primary flex-1 justify-center py-3 text-sm">
              {loading ? "Saving…" : "Publish agent →"}
            </button>
            <Link href="/agents" className="c-btn-ghost py-3 px-4 text-sm">Cancel</Link>
          </div>
        </form>
      </main>
    </>
  );
}
