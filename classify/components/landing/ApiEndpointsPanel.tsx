"use client";

import { useState } from "react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/tasks",
    title: "List tasks",
    body: "Returns every task, newest first. Powers the live preview above and the /tasks page.",
    tiesTo: "Live marketplace section",
  },
  {
    method: "POST",
    path: "/api/tasks",
    title: "Create task",
    body: "Body: company_name, ai_output, criteria, bounty_wld. Same contract as the Post a Task form.",
    tiesTo: "/post",
  },
  {
    method: "POST",
    path: "/api/responses",
    title: "Submit evaluation",
    body: "Body: task_id, nullifier_hash, rating (1–5), feedback_text. Called after World ID proof on a task page.",
    tiesTo: "/tasks/[id]",
  },
  {
    method: "POST",
    path: "/api/verify",
    title: "Verify World ID proof",
    body: "Body: proof, action, signal. Server-side check against World Developer API.",
    tiesTo: "WorldIDButton → task submit flow",
  },
  {
    method: "POST",
    path: "/api/seed",
    title: "Seed demo tasks",
    body: "Inserts sample tasks only when the tasks table is empty. Safe helper for empty databases.",
    tiesTo: "“Load sample tasks” on this page",
  },
] as const;

export default function ApiEndpointsPanel() {
  const [expanded, setExpanded] = useState<string | null>(ENDPOINTS[0].path);

  return (
    <section id="api" className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-20">
      <div className="c-pill mb-4">Backend</div>
      <h2
        className="font-display text-white leading-none mb-2"
        style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", letterSpacing: "0.03em" }}
      >
        ENDPOINTS TIED TO THE PRODUCT
      </h2>
      <p className="text-sm mb-8 max-w-2xl" style={{ color: "var(--text-muted)" }}>
        Every route below is used by the UI somewhere. Expand a row to see how it connects.
      </p>

      <ul className="space-y-2" role="list">
        {ENDPOINTS.map((ep) => {
          const isOpen = expanded === ep.path;
          return (
            <li key={ep.path}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : ep.path)}
                className="w-full text-left rounded-xl border transition-colors"
                style={{
                  background: "var(--card)",
                  borderColor: isOpen ? "rgba(0,255,135,0.18)" : "var(--border)",
                  padding: "14px 18px",
                }}
                aria-expanded={isOpen}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background:
                        ep.method === "GET"
                          ? "rgba(100,180,255,0.12)"
                          : "rgba(0,255,135,0.12)",
                      color: ep.method === "GET" ? "#7CB9FF" : "var(--signal)",
                    }}
                  >
                    {ep.method}
                  </span>
                  <code className="text-sm text-white font-mono" style={{ fontFamily: "var(--font-mono)" }}>
                    {ep.path}
                  </code>
                  <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                    {isOpen ? "Hide" : "Details"}
                  </span>
                </div>
                {isOpen && (
                  <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-semibold text-white">{ep.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>
                      {ep.body}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-mono" style={{ color: "var(--text-muted)" }}>
                      UI: {ep.tiesTo}
                    </p>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
