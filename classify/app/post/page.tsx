"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { Tokens } from "@worldcoin/minikit-js/commands";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { DEFAULT_TASK_MAX_RESPONSES } from "@/lib/world/constants";
import { createSimulatedPaymentReference } from "@/lib/world/payments";
import type { PayResult } from "@worldcoin/minikit-js/commands";

const BOUNTY_PRESETS = [0.25, 0.5, 1.0, 2.0];
const RESPONSE_CAP_PRESETS = [5, 10, 25];

export default function PostTaskPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [criteria, setCriteria] = useState("");
  const [bounty, setBounty] = useState("0.50");
  const [maxResponses, setMaxResponses] = useState(String(DEFAULT_TASK_MAX_RESPONSES));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentsConfigured, setPaymentsConfigured] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        setPaymentsConfigured(Boolean(json?.world_payments_configured));
      })
      .catch(() => {
        setPaymentsConfigured(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const bountyNum = parseFloat(bounty);
    const maxResponsesNum = parseInt(maxResponses, 10);
    if (isNaN(bountyNum) || bountyNum <= 0) {
      setError("Please enter a valid WLD bounty amount.");
      return;
    }
    if (!Number.isInteger(maxResponsesNum) || maxResponsesNum <= 0) {
      setError("Please enter a valid max funded response count.");
      return;
    }

    if (paymentsConfigured && (!MiniKit.isInstalled() || !MiniKit.isInWorldApp())) {
      setError("Open Classify inside World App to fund a task with WLD.");
      return;
    }

    setLoading(true);
    try {
      const fundingAmount = Number((bountyNum * maxResponsesNum).toFixed(4));
      let initJson: { reference?: string; challenge?: string; to?: string; token_amount?: string; error?: string } = {};
      let payment: { data: PayResult };
      if (paymentsConfigured) {
        const initRes = await fetch("/api/payments/task-funding/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ funding_amount_wld: fundingAmount }),
        });
        initJson = await initRes.json().catch(() => ({}));
        if (!initRes.ok) {
          throw new Error(typeof initJson?.error === "string" ? initJson.error : "Could not initialize task funding.");
        }

        payment = await MiniKit.pay({
          reference: initJson.reference!,
          to: initJson.to!,
          tokens: [{ symbol: Tokens.WLD, token_amount: initJson.token_amount! }],
          description: `Fund ${maxResponsesNum} Classify responses`,
          fallback: () => {
            throw new Error("Open Classify inside World App to fund this task.");
          },
        });
      } else {
        payment = {
          data: createSimulatedPaymentReference(`sim-ref-${Date.now()}`),
        };
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          ai_output: aiOutput.trim(),
          criteria: criteria.trim(),
          bounty_wld: bountyNum,
          max_responses: maxResponsesNum,
          funding_reference: initJson.reference,
          funding_challenge: initJson.challenge,
          funding_payload: payment.data,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "Failed to post task." }));
        throw new Error(msg ?? "Failed to post task.");
      }

      const { id } = await res.json();
      router.push(`/posted?highlight=${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post task.");
      setLoading(false);
      return;
    }
  }

  const bountyNum = parseFloat(bounty) || 0;
  const maxResponsesNum = parseInt(maxResponses, 10) || DEFAULT_TASK_MAX_RESPONSES;
  const fundingTotal = bountyNum * maxResponsesNum;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-5 py-12">

        <div className="mb-10 animate-fade-up">
          <div className="c-pill mb-3">For Companies</div>
          <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-2">
            POST A TASK
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Verified humans will rate your AI output and provide structured feedback.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up animate-delay-100">
          {error && (
            <div style={{ background: "rgba(255,69,84,0.08)", border: "1px solid rgba(255,69,84,0.2)", borderRadius: 12, padding: "12px 16px" }}>
              <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
            </div>
          )}

          {/* Company name */}
          <div className="post-card">
            <label className="c-label">Company / Team Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. OpenEval AI"
              className="c-input"
            />
          </div>

          {/* AI Output */}
          <div className="post-card">
            <label className="c-label">AI Output to Evaluate</label>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Paste the exact text, code, or content you want humans to review.
            </p>
            <textarea
              required
              rows={8}
              value={aiOutput}
              onChange={(e) => setAiOutput(e.target.value)}
              placeholder="Paste your AI-generated content here…"
              className="c-input resize-y"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
            />
          </div>

          {/* Criteria */}
          <div className="post-card">
            <label className="c-label">Evaluation Criteria</label>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Tell workers exactly what to look for. The more specific, the better the feedback.
            </p>
            <textarea
              required
              rows={4}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="e.g. Rate this output for: (1) Factual accuracy, (2) Completeness, (3) Clarity…"
              className="c-input resize-y"
            />
          </div>

          {/* Bounty */}
          <div className="post-card">
            <label className="c-label">WLD Bounty per Response</label>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Each verified human who completes this task earns this amount from your funded pool.
            </p>

            {/* Presets */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {BOUNTY_PRESETS.map((preset) => {
                const selected = bountyNum === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBounty(preset.toFixed(2))}
                    style={{
                      borderRadius: 10, padding: "8px 16px",
                      fontSize: "0.8125rem", fontWeight: 600,
                      border: selected ? "1px solid var(--gold-border)" : "1px solid var(--border)",
                      background: selected ? "var(--gold-dim)" : "transparent",
                      color: selected ? "var(--gold)" : "var(--text-muted)",
                      cursor: "pointer", transition: "all 0.15s",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {preset} WLD
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                className="c-input"
                style={{ width: 140, fontFamily: "var(--font-mono)" }}
              />
              <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>WLD</span>
            </div>

            {/* Cost preview */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginTop: 16 }}>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                <span>Per response</span>
                <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>{bountyNum.toFixed(2)} WLD</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>Max funded responses</span>
                <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>{maxResponsesNum}</span>
              </div>
            </div>
          </div>

          <div className="post-card">
            <label className="c-label">Max Funded Responses</label>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              We’ll fund this many worker payouts up front in a single World App payment.
            </p>

            <div className="flex gap-2 mb-4 flex-wrap">
              {RESPONSE_CAP_PRESETS.map((preset) => {
                const selected = maxResponsesNum === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMaxResponses(String(preset))}
                    style={{
                      borderRadius: 10, padding: "8px 16px",
                      fontSize: "0.8125rem", fontWeight: 600,
                      border: selected ? "1px solid var(--signal-border)" : "1px solid var(--border)",
                      background: selected ? "var(--signal-dim)" : "transparent",
                      color: selected ? "var(--signal)" : "var(--text-muted)",
                      cursor: "pointer", transition: "all 0.15s",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {preset} workers
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="1"
                min="1"
                max="500"
                required
                value={maxResponses}
                onChange={(e) => setMaxResponses(e.target.value)}
                className="c-input"
                style={{ width: 140, fontFamily: "var(--font-mono)" }}
              />
              <span className="text-sm font-semibold" style={{ color: "var(--signal)" }}>workers</span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginTop: 16 }}>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                <span>Total WLD charged now</span>
                <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>{fundingTotal.toFixed(2)} WLD</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {paymentsConfigured
                  ? "The payment opens in World App and funds the payout pool before the task is published."
                  : "Demo mode is active, so the task will appear funded without requiring a live World payment."}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="c-btn-primary flex-1 justify-center py-3.5 text-sm"
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "iris-spin 1s linear infinite" }}>
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="20 14" />
                  </svg>
                  Funding & posting…
                </span>
              ) : "Fund & Post Task →"}
            </button>
            <Link href="/posted" className="c-btn-ghost py-3.5">
              Posted tasks
            </Link>
          </div>
        </form>
      </main>

      <style>{`
        .post-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
      `}</style>
    </>
  );
}
