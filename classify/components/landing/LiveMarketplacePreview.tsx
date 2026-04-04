"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Task } from "@/types/database";

export default function LiveMarketplacePreview() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j?.error === "string" ? j.error : "Could not load tasks.");
        setTasks([]);
        return;
      }
      const data = (await res.json()) as Task[];
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setError("Network error loading tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    setLoading(false);
    load();
  };

  const seed = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSeedMsg(typeof j?.error === "string" ? j.error : "Seed failed.");
        return;
      }
      setSeedMsg(typeof j?.message === "string" ? j.message : "Done.");
      await load();
    } catch {
      setSeedMsg("Seed request failed.");
    } finally {
      setSeeding(false);
    }
  };

  const open = (tasks ?? []).filter((t) => t.status === "open");
  const pool = open.reduce((s, t) => s + Number(t.bounty_wld), 0);
  const preview = open.slice(0, 4);

  return (
    <section id="live-market" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <div className="c-pill mb-4">Live · GET /api/tasks</div>
          <h2
            className="font-display text-white leading-none mb-2"
            style={{ fontSize: "clamp(2rem,5vw,3.25rem)", letterSpacing: "0.03em" }}
          >
            MARKETPLACE<br />RIGHT NOW
          </h2>
          <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
            This section calls your tasks API on load. Refresh to pull the latest open bounties.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing || loading}
            className="c-btn-ghost py-2.5 text-xs"
          >
            {refreshing || loading ? "Loading…" : "Refresh data"}
          </button>
          {!loading && (tasks?.length ?? 0) === 0 && (
            <button
              type="button"
              onClick={seed}
              disabled={seeding}
              className="c-btn-gold py-2.5 text-xs"
            >
              {seeding ? "Seeding…" : "Load sample tasks"}
            </button>
          )}
        </div>
      </div>

      {seedMsg && (
        <p className="text-xs font-mono mb-4" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          POST /api/seed → {seedMsg}
        </p>
      )}

      <div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <StatChip label="Open tasks" value={loading ? "—" : String(open.length)} pulse={!loading && open.length > 0} />
        <StatChip label="WLD in open bounties" value={loading ? "—" : pool.toFixed(2)} />
        <StatChip label="Total listed" value={loading ? "—" : String(tasks?.length ?? 0)} />
        <StatChip
          label="API"
          value={error ? "Error" : loading ? "…" : "OK"}
          accent={error ? "var(--red)" : "var(--signal)"}
        />
      </div>

      {error && (
        <div
          className="rounded-xl border px-4 py-3 mb-8 text-sm"
          style={{ borderColor: "rgba(255,69,84,0.35)", background: "rgba(255,69,84,0.06)", color: "var(--text-dim)" }}
        >
          {error}
        </div>
      )}

      {!loading && preview.length === 0 && !error && (
        <div
          className="rounded-2xl border border-dashed text-center py-16 px-6"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="font-display text-2xl text-white tracking-wider mb-2">NO OPEN TASKS YET</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Post one or load sample tasks to see live cards here.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/post" className="c-btn-primary py-2.5 text-xs">
              Post a task →
            </Link>
            <Link href="/tasks" className="c-btn-ghost py-2.5 text-xs">
              Full task board
            </Link>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {preview.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="group rounded-2xl border p-4 text-left transition-all"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-medium truncate" style={{ color: "var(--text-dim)" }}>
                  {task.company_name}
                </span>
                <span className="c-badge-gold shrink-0 text-[10px] py-0.5 px-2">◈ {task.bounty_wld} WLD</span>
              </div>
              <p
                className="text-xs leading-relaxed line-clamp-3 mb-4 font-mono"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {task.ai_output}
              </p>
              <span className="text-xs font-semibold" style={{ color: "var(--signal)" }}>
                Open task →
              </span>
            </Link>
          ))}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-8 text-center">
          <Link href="/tasks" className="c-btn-ghost px-6 py-2.5 text-xs">
            View all tasks
          </Link>
        </div>
      )}
    </section>
  );
}

function StatChip({
  label,
  value,
  pulse,
  accent,
}: {
  label: string;
  value: string;
  pulse?: boolean;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: "var(--border)",
      }}
    >
      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-lg font-semibold text-white flex items-center gap-2">
        {pulse && <span className="c-live-dot" />}
        <span style={{ color: accent ?? "inherit" }}>{value}</span>
      </p>
    </div>
  );
}
