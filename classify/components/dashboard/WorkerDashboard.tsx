"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StarRating from "@/components/StarRating";
import { clearWorkerNullifier, getWorkerNullifier } from "@/lib/workerIdentity";
import type { WorkerSummaryRow } from "@/types/database";

export default function WorkerDashboard() {
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [rows, setRows] = useState<WorkerSummaryRow[]>([]);
  const [totalWld, setTotalWld] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (hash: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/worker/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nullifier_hash: hash }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "Could not load dashboard.");
        setRows([]);
        setTotalWld(0);
        return;
      }
      setRows(Array.isArray(j.rows) ? j.rows : []);
      setTotalWld(typeof j.total_wld === "number" ? j.total_wld : 0);
    } catch {
      setError("Network error.");
      setRows([]);
      setTotalWld(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const h = getWorkerNullifier();
    setNullifier(h);
    if (h) load(h);
    else setLoading(false);
  }, [load]);

  const refresh = () => {
    const h = getWorkerNullifier();
    setNullifier(h);
    if (h) load(h);
  };

  const forget = () => {
    clearWorkerNullifier();
    setNullifier(null);
    setRows([]);
    setTotalWld(0);
    setError(null);
  };

  const current = rows.filter((r) => r.task.status === "open");
  const previous = rows.filter((r) => r.task.status === "closed");

  if (!nullifier && !loading) {
    return (
      <div className="space-y-8">
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="iris-container mx-auto mb-6" style={{ width: 64, height: 64 }} aria-hidden>
            <div className="iris-ring iris-ring-1" />
            <div className="iris-ring iris-ring-2" />
            <div className="iris-ring iris-ring-3" />
            <div className="iris-core" />
          </div>
          <p className="font-display text-3xl text-white tracking-wider mb-2">YOUR WORKER DASHBOARD</p>
          <p className="text-sm max-w-md mx-auto mb-8" style={{ color: "var(--text-muted)" }}>
            After you verify with World ID and submit feedback on a task, this browser remembers your session so we can
            show tasks you&apos;ve evaluated, history, and WLD earned (per bounty).
          </p>
          <Link href="/tasks" className="c-btn-primary px-8 py-3 text-sm justify-center inline-flex">
            Browse tasks to evaluate →
          </Link>
          <p className="text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            Posters: see responses on{" "}
            <Link href="/posted" className="underline" style={{ color: "var(--signal)" }}>
              Posted tasks
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="c-pill mb-3">Your evaluations</div>
          <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-2">
            DASHBOARD
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Open tasks you&apos;ve rated (still collecting), closed tasks (archived), and total WLD attributed to your submissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={refresh} className="c-btn-ghost py-2.5 text-xs" disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button type="button" onClick={forget} className="c-btn-ghost py-2.5 text-xs">
            Forget this browser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="WLD earned (total)" value={loading ? "…" : totalWld.toFixed(2)} accent="gold" suffix=" WLD" />
        <Stat label="Evaluations" value={loading ? "…" : rows.length} />
        <Stat label="On open tasks" value={loading ? "…" : current.length} accent="signal" />
        <Stat label="On closed tasks" value={loading ? "…" : previous.length} />
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,69,84,0.3)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      <section>
        <h2 className="font-display text-2xl text-white tracking-wider mb-4">CURRENT — OPEN TASKS YOU RATED</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          The task is still open; other workers may still be submitting.
        </p>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : current.length === 0 ? (
          <Empty hint="Complete an evaluation on an open task — it will show up here." />
        ) : (
          <ul className="space-y-3">
            {current.map((r) => (
              <WorkerRow key={r.id} row={r} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-white tracking-wider mb-4">PREVIOUS — CLOSED TASKS</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Tasks that are closed; your submission is on the record.
        </p>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : previous.length === 0 ? (
          <Empty hint="When a task you evaluated closes, it moves here." />
        ) : (
          <ul className="space-y-3">
            {previous.map((r) => (
              <WorkerRow key={r.id} row={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, suffix = "", accent }: { label: string; value: string | number; suffix?: string; accent?: "signal" | "gold" }) {
  const c =
    accent === "signal" ? "var(--signal)" :
    accent === "gold" ? "var(--gold)" :
    "var(--text)";
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <p className="font-display text-3xl leading-none" style={{ color: c }}>
        {value}{suffix}
      </p>
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="rounded-xl border border-dashed py-10 px-6 text-center" style={{ borderColor: "var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{hint}</p>
    </div>
  );
}

function WorkerRow({ row }: { row: WorkerSummaryRow }) {
  const t = row.task;
  return (
    <li className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{t.company_name}</span>
          <span className="c-badge-gold text-[10px] py-0.5">◈ {t.bounty_wld} WLD</span>
          {t.status === "open" ? (
            <span className="c-badge-signal text-[10px] py-0.5"><span className="c-live-dot" />Open</span>
          ) : (
            <span className="c-badge-muted text-[10px] py-0.5">Closed</span>
          )}
        </div>
        <p className="text-xs line-clamp-2 font-mono mb-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {t.ai_output}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <StarRating value={row.rating} readonly size="sm" />
          {row.flagged_suspicious && (
            <span className="text-[10px] font-mono uppercase" style={{ color: "var(--red)" }}>Flagged</span>
          )}
          <span>{new Date(row.created_at).toLocaleString()}</span>
        </div>
      </div>
      <Link href={`/tasks/${t.id}`} className="c-btn-ghost py-2 text-xs shrink-0 justify-center">
        View task
      </Link>
    </li>
  );
}
