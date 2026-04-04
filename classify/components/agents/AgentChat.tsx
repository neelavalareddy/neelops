"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import WorldIDButton from "@/components/WorldIDButton";
import { persistWorkerNullifier, getWorkerNullifier } from "@/lib/workerIdentity";
import type { Agent, AgentMessage, AgentSession } from "@/types/agents";

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
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startOrResume = useCallback(
    async (hash: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/agents/${agent.id}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nullifier_hash: hash }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCompleteMsg(typeof j?.error === "string" ? j.error : "Could not open session.");
          return;
        }
        setSession(j.session);
        setMessages(Array.isArray(j.messages) ? j.messages : []);
        setCompleteMsg(null);
      } finally {
        setLoading(false);
        setBooting(false);
      }
    },
    [agent.id]
  );

  useEffect(() => {
    const h = getWorkerNullifier();
    if (h) {
      setNullifier(h);
      startOrResume(h);
    } else {
      setBooting(false);
    }
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
        setCompleteMsg(typeof j?.error === "string" ? j.error : "Send failed.");
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

  async function requestPayout() {
    if (!session || !nullifier || loading) return;
    setLoading(true);
    setCompleteMsg(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/sessions/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nullifier_hash: nullifier }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok && j.status === "eligible") {
        setCompleteMsg(`Eligible for ◈ ${j.bounty_wld} WLD — ${j.payout_note ?? ""}`);
        setSession((s) => (s ? { ...s, status: "eligible", payout_note: j.payout_note } : s));
      } else if (j.status === "rejected") {
        setCompleteMsg(`Not eligible: ${(j.reasons as string[])?.join(" ") ?? j.payout_note ?? "See criteria."}`);
        setSession((s) => (s ? { ...s, status: "rejected", payout_note: j.payout_note } : s));
      } else {
        setCompleteMsg(typeof j?.reason === "string" ? j.reason : j?.error ?? "Could not complete.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (agent.status === "closed") {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <p className="font-display text-xl text-white">This agent is closed.</p>
        <Link href="/agents" className="c-btn-ghost mt-4 inline-flex py-2 text-xs">Browse agents</Link>
      </div>
    );
  }

  if (booting) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading session…</p>;
  }

  if (!nullifier || !session) {
    return (
      <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          Verify once with World ID to chat with this agent. Classify scores every message for relevance, rule breaks,
          and AI-generated cheating — pass the gate to claim the listed WLD bounty (mocked transfer in this demo).
        </p>
        <WorldIDButton taskId={agent.id} onVerified={onVerified} />
      </div>
    );
  }

  const userTurns = messages.filter((m) => m.role === "user").length;
  const canRequestPayout = session.status === "active" && userTurns >= 2;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border overflow-hidden flex flex-col"
        style={{ borderColor: "var(--border)", background: "var(--card)", maxHeight: "min(560px, 70vh)" }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Say something to move toward the objective. The company agent will reply; Classify evaluates your side only.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className="inline-block max-w-[92%] rounded-xl px-3 py-2 text-sm text-left"
                style={{
                  background: m.role === "user" ? "var(--signal-dim)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${m.role === "user" ? "var(--signal-border)" : "var(--border)"}`,
                  color: "var(--text-dim)",
                }}
              >
                <span className="text-[10px] font-mono uppercase block mb-1" style={{ color: "var(--text-muted)" }}>
                  {m.role === "user" ? "You" : agent.name}
                </span>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "user" && m.evaluation && (
                <div className="mt-1 inline-block text-left max-w-[92%]">
                  <div className="flex flex-wrap gap-1 justify-end">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                      rel {m.evaluation.relevance_1_5}/5
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                      AI-like {Math.round(Number(m.evaluation.ai_likelihood_0_1) * 100)}%
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: m.evaluation.rules_compliant ? "rgba(0,255,135,0.08)" : "rgba(255,69,84,0.12)",
                        color: m.evaluation.rules_compliant ? "var(--signal)" : "var(--red)",
                      }}
                    >
                      {m.evaluation.rules_compliant ? "rules OK" : "rules"}
                    </span>
                  </div>
                  {m.evaluation.rationale && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{m.evaluation.rationale}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {session.status === "active" && (
          <div className="border-t p-3 flex gap-2" style={{ borderColor: "var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Message the agent…"
              className="c-input flex-1 text-sm"
              disabled={loading}
            />
            <button type="button" onClick={send} disabled={loading || !input.trim()} className="c-btn-primary px-4 py-2 text-xs shrink-0">
              Send
            </button>
          </div>
        )}
      </div>

      {completeMsg && (
        <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
          {completeMsg}
        </div>
      )}

      {session.status === "active" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={requestPayout}
            disabled={loading || !canRequestPayout}
            className="c-btn-gold py-2.5 text-xs"
          >
            Request payout (Classify gate)
          </button>
          {!canRequestPayout && (
            <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>
              Need ≥2 user messages to request review.
            </span>
          )}
        </div>
      )}

      {(session.status === "eligible" || session.status === "rejected") && (
        <div className="flex gap-2">
          <Link href="/agents" className="c-btn-ghost py-2 text-xs">Other agents</Link>
          <Link href="/dashboard" className="c-btn-ghost py-2 text-xs">Dashboard</Link>
        </div>
      )}
    </div>
  );
}
