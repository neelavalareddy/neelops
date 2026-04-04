import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import TaskCard from "@/components/TaskCard";
import type { Task, Response } from "@/types/database";

export const revalidate = 0;

export default async function TasksPage() {
  const supabase = createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Task[] | null };

  const { data: responses } = await supabase
    .from("responses")
    .select("task_id, rating") as { data: Pick<Response, "task_id" | "rating">[] | null };

  const stats: Record<string, { count: number; avg: number | null }> = {};
  for (const r of responses ?? []) {
    if (!stats[r.task_id]) stats[r.task_id] = { count: 0, avg: null };
    stats[r.task_id].count++;
  }
  for (const taskId of Object.keys(stats)) {
    const taskResponses = (responses ?? []).filter((r) => r.task_id === taskId);
    stats[taskId].avg =
      taskResponses.length > 0
        ? taskResponses.reduce((s, r) => s + r.rating, 0) / taskResponses.length
        : null;
  }

  const openTasks = (tasks ?? []).filter((t) => t.status === "open");
  const closedTasks = (tasks ?? []).filter((t) => t.status === "closed");

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 py-12 space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
          <div>
            <div className="c-pill mb-3">Live Marketplace</div>
            <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-2">
              OPEN TASKS
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Verify with World ID once per task — rate, submit, earn WLD.
            </p>
          </div>
          <div className="shrink-0">
            <span className="c-badge-signal" style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
              <span className="c-live-dot" />
              {openTasks.length} open
            </span>
          </div>
        </div>

        {/* World ID explainer */}
        <div className="animate-fade-up animate-delay-100" style={{
          display: "flex", alignItems: "flex-start", gap: 16,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "18px 20px"
        }}>
          <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }} className="iris-container">
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

        {/* Open tasks */}
        {openTasks.length === 0 ? (
          <div style={{ borderRadius: 20, border: "2px dashed var(--border)", padding: "64px 24px", textAlign: "center" }}>
            <p className="text-4xl mb-3">📭</p>
            <p className="font-display text-2xl text-white tracking-wider mb-1">NO OPEN TASKS</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Check back soon, or post a task yourself.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                responseCount={stats[task.id]?.count ?? 0}
                avgRating={stats[task.id]?.avg ?? null}
              />
            ))}
          </div>
        )}

        {/* Closed tasks */}
        {closedTasks.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Closed Tasks
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
              {closedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  responseCount={stats[task.id]?.count ?? 0}
                  avgRating={stats[task.id]?.avg ?? null}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
