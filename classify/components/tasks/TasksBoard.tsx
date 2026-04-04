"use client";

import { useMemo, useState } from "react";
import TaskCard from "@/components/TaskCard";
import type { Task } from "@/types/database";

export type TaskStats = Record<string, { count: number; avg: number | null }>;

type StatusFilter = "open" | "all" | "closed";
type SortKey = "newest" | "bounty_desc" | "responses_desc";

interface Props {
  tasks: Task[];
  stats: TaskStats;
}

export default function TasksBoard({ tasks, stats }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tasks;

    if (status === "open") list = list.filter((t) => t.status === "open");
    else if (status === "closed") list = list.filter((t) => t.status === "closed");

    if (q) {
      list = list.filter(
        (t) =>
          t.company_name.toLowerCase().includes(q) ||
          t.ai_output.toLowerCase().includes(q) ||
          t.criteria.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "bounty_desc") return b.bounty_wld - a.bounty_wld;
      if (sort === "responses_desc") {
        const ca = stats[a.id]?.count ?? 0;
        const cb = stats[b.id]?.count ?? 0;
        return cb - ca;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted;
  }, [tasks, query, status, sort, stats]);

  const openCount = tasks.filter((t) => t.status === "open").length;
  const closedCount = tasks.filter((t) => t.status === "closed").length;

  const filterBtn = (key: StatusFilter, label: string) => (
    <button
      type="button"
      onClick={() => setStatus(key)}
      className="tasks-filter-btn"
      data-active={status === key}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <div className="c-pill mb-3">Browse · earn WLD</div>
          <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-2">
            BROWSE TASKS
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Pick a task, verify once with World ID, submit your rating and feedback. Your WLD history lives on{" "}
            <a href="/dashboard" className="underline" style={{ color: "var(--signal)" }}>Dashboard</a>.
          </p>
        </div>
        <div className="shrink-0">
          <span className="c-badge-signal" style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
            <span className="c-live-dot" />
            {openCount} open
          </span>
        </div>
      </div>

      <div
        className="animate-fade-up animate-delay-100"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="iris-container"
        >
          <div className="iris-ring iris-ring-1" />
          <div className="iris-ring iris-ring-2" />
          <div className="iris-ring iris-ring-3" />
          <div className="iris-core" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">How verification works</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Each task requires a World ID proof before you can submit. This ensures every response is from a unique
            real human and prevents double-submitting. Your identity stays private — only a nullifier hash is stored.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between animate-fade-up animate-delay-150">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Task status">
          {filterBtn("open", `Open (${openCount})`)}
          {filterBtn("all", `All (${tasks.length})`)}
          {filterBtn("closed", `Closed (${closedCount})`)}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="sr-only" htmlFor="tasks-search">
            Search tasks
          </label>
          <input
            id="tasks-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, output, criteria…"
            className="c-input tasks-search-input"
          />
          <label className="sr-only" htmlFor="tasks-sort">
            Sort tasks
          </label>
          <select
            id="tasks-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="c-input tasks-sort-select"
          >
            <option value="newest">Newest first</option>
            <option value="bounty_desc">Highest bounty</option>
            <option value="responses_desc">Most responses</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            borderRadius: 20,
            border: "2px dashed var(--border)",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="font-display text-2xl text-white tracking-wider mb-1">NO TASKS HERE</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {query ? "Try a different search or filter." : "Check back soon, or post a task yourself."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              responseCount={stats[task.id]?.count ?? 0}
              avgRating={stats[task.id]?.avg ?? null}
            />
          ))}
        </div>
      )}

      <style>{`
        .tasks-filter-btn {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .tasks-filter-btn:hover {
          color: var(--text-dim);
          border-color: var(--border-strong);
        }
        .tasks-filter-btn[data-active="true"] {
          color: var(--signal);
          border-color: var(--signal-border);
          background: var(--signal-dim);
        }
        .tasks-search-input { min-width: min(100%, 280px); }
        .tasks-sort-select {
          min-width: 180px;
          cursor: pointer;
          appearance: auto;
        }
      `}</style>
    </main>
  );
}
