"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import WorldIDButton from "@/components/WorldIDButton";
import SessionScoreCard from "@/components/evaluation/SessionScoreCard";
import { persistWorkerNullifier, getWorkerNullifier } from "@/lib/workerIdentity";
import type { Agent, AgentMessage, AgentSession, SessionEvaluation } from "@/types/agents";

type Msg = AgentMessage & {
  evaluation?: {
    relevance_1_5: number;
    ai_likelihood_0_1: number;
    rules_compliant: boolean;
    rationale: string | null;
  } | null;
};

interface Props {
  agent: Agent;
}

export default function AgentChat({ agent }: Props) {
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [sessionEval, setSessionEval] = useState<SessionEvaluation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const judging = statusMsg === "Evaluating your session…";

  const startOrResume = useCallback(async (hash: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nullifier_hash: hash }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMsg(typeof j?.error === "string" ? j.error : "Could not open session.");
        return;
      }
      setSession(j.session);
      setMessages(Array.isArray(j.messages) ? j.messages : []);
      setStatusMsg(null);
    } finally {
      setLoading(false);
      setBooting(false);
    }
  }, [agent.id]);

  useEffect(() => {
    const h = getWorkerNullifier();
    if (h) { setNullifier(h); startOrResume(h); }
    else setBooting(false);
  }, [startOrResume]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onVerified(hash: string) {
    persistWorkerNullifier(hash);
    setNullifier(hash);
    startOrResume(hash);
  }

  async function send() {
    const t = input.trim();
    if (!t || !session || !nullifier || loading) return;
    setLoading(true);
    setInput("");
    try {
      const res = await fetch(`/api/agents/${agent.id}/sessions/${session.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nullifier_hash: nullifier, content: t }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMsg(typeof j?.error === "string" ? j.error : "Send failed.");
        setLoading(false);
        return;
      }
      const u = j.userMessage as Msg | undefined;
      const a = j.assistantMessage as AgentMessage | undefined;
      const ev = j.evaluation as Msg["evaluation"];
      setMessages((prev) => {
        const next = [...prev];
        if (u) next.push({ ...u, evaluation: ev ?? null });
        if (a) next.push({ ...a, evaluation: null });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitForEvaluation() {
    if (!session || !nullifier || loading) return;
    setStatusMsg("Evaluating your session…");
    try {
      const res = await fetch(`/api/agents/${agent.id}/sessions/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nullifier_hash: nullifier }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.evaluation) setSessionEval(j.evaluation as SessionEvaluation);
      if (j.ok && j.status === "eligible") {
        setSession((s) => s ? { ...s, status: "eligible", payout_note: j.payout_note } : s);
        setStatusMsg(null);
      } else if (j.status === "rejected") {
        setSession((s) => s ? { ...s, status: "rejected", payout_note: j.payout_note } : s);
        setStatusMsg(null);
      } else {
        setStatusMsg(typeof j?.reason === "string" ? j.reason : j?.error ?? "Could not complete.");
      }
    } catch {
      setStatusMsg("Evaluation request failed. Please try again.");
    }
  }

  if (agent.status === "closed") {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--text-2)", marginBottom: 12 }}>This agent is closed.</div>
        <Link href="/agents" className="c-btn-ghost" style={{ padding: "8px 18px", fontSize: 12 }}>Browse agents</Link>
      </div>
    );
  }

  if (booting) {
    return <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", padding: "16px 0" }}>Loading session…</div>;
  }

  if (!nullifier || !session) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 24px" }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 20 }}>
          Verify once with World ID to start. The judge scores your messages in real-time for relevance,
          rule compliance, and human authenticity — pass all four gates to earn the bounty.
        </div>
        <WorldIDButton taskId={agent.id} onVerified={onVerified} />
      </div>
    );
  }

  const userTurns = messages.filter((m) => m.role === "user").length;
  const canSubmit = session.status === "active" && userTurns >= 3;
  const isFinalized = session.status === "eligible" || session.status === "rejected";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Turn indicator */}
      {session.status === "active" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} style={{ width: 20, height: 3, borderRadius: 2, background: userTurns >= n ? "var(--amber)" : "var(--border-2)", transition: "background 0.3s" }} />
            ))}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", marginLeft: 6, alignSelf: "center" }}>
              {userTurns}/3 min turns
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>{agent.name}</span>
        </div>
      )}

      {/* Chat window */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "min(540px, 65vh)",
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", padding: "8px 0" }}>
              Say something to move toward the objective. The judge watches your messages — not the agent&apos;s.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%",
                background: m.role === "user" ? "rgba(255,214,10,0.08)" : "var(--surface-2)",
                border: `1px solid ${m.role === "user" ? "var(--amber-border)" : "var(--border)"}`,
                borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                padding: "10px 14px",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: m.role === "user" ? "var(--amber)" : "var(--text-3)", marginBottom: 5 }}>
                  {m.role === "user" ? "You" : agent.name}
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)", lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
              </div>
              {/* Per-message eval chips */}
              {m.role === "user" && m.evaluation && (
                <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "rgba(255,255,255,0.05)", color: "var(--text-3)" }}>
                    rel {m.evaluation.relevance_1_5}/5
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "rgba(255,255,255,0.05)", color: Number(m.evaluation.ai_likelihood_0_1) > 0.6 ? "var(--fail)" : "var(--text-3)" }}>
                    AI {Math.round(Number(m.evaluation.ai_likelihood_0_1) * 100)}%
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 3,
                    background: m.evaluation.rules_compliant ? "var(--pass-dim)" : "var(--fail-dim)",
                    color: m.evaluation.rules_compliant ? "var(--pass)" : "var(--fail)",
                    border: `1px solid ${m.evaluation.rules_compliant ? "var(--pass-border)" : "var(--fail-border)"}`,
                  }}>
                    {m.evaluation.rules_compliant ? "rules ✓" : "rules ✗"}
                  </span>
                  {m.evaluation.rationale && (
                    <div style={{ width: "100%", fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", marginTop: 2, textAlign: "right" }}>
                      {m.evaluation.rationale}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {session.status === "active" && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Message the agent…"
              className="c-input"
              style={{ flex: 1, fontSize: 13 }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="c-btn-primary"
              style={{ padding: "8px 16px", fontSize: 12, flexShrink: 0 }}
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          background: judging ? "var(--amber-dim)" : "var(--surface)",
          border: `1px solid ${judging ? "var(--amber-border)" : "var(--border)"}`,
          borderRadius: 8, padding: "10px 14px",
          fontFamily: "var(--font-mono)", fontSize: 12,
          color: judging ? "var(--amber)" : "var(--text-2)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {judging && <span className="c-live-dot" />}
          {statusMsg}
        </div>
      )}

      {/* Submit for judgment */}
      {session.status === "active" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={submitForEvaluation}
            disabled={judging || loading || !canSubmit}
            className="c-btn-primary"
            style={{ padding: "10px 22px", fontSize: 13 }}
          >
            {judging ? "Evaluating…" : "Submit for Judgment"}
          </button>
          {!canSubmit && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
              Need ≥ 3 messages first
            </span>
          )}
        </div>
      )}

      {/* Verdict card */}
      {isFinalized && sessionEval && (
        <div className="animate-verdict">
          <SessionScoreCard evaluation={sessionEval} bounty_wld={agent.bounty_wld} />
        </div>
      )}

      {/* Finalized without fresh eval data */}
      {isFinalized && !sessionEval && session.payout_note && (
        <div style={{
          background: session.status === "eligible" ? "var(--pass-dim)" : "var(--fail-dim)",
          border: `1px solid ${session.status === "eligible" ? "var(--pass-border)" : "var(--fail-border)"}`,
          borderRadius: 8, padding: "12px 16px",
          fontFamily: "var(--font-body)", fontSize: 13,
          color: session.status === "eligible" ? "var(--pass)" : "var(--fail)",
        }}>
          {session.payout_note}
        </div>
      )}

      {/* Post-session nav */}
      {isFinalized && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Link href="/agents" className="c-btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>Other agents</Link>
          <Link href="/dashboard" className="c-btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>Dashboard</Link>
        </div>
      )}
    </div>
  );
}
