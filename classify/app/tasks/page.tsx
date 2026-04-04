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

  // Build per-task stats
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
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="section-pill mb-3">Live Marketplace</div>
            <h1 className="text-4xl font-black text-white tracking-tight">Open Tasks</h1>
            <p className="text-gray-500 text-sm mt-2">
              Verify with World ID once per task, then rate and submit feedback to earn WLD.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
            <span className="verified-badge">
              {openTasks.length} open
            </span>
          </div>
        </div>

        {/* World ID explainer */}
        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-xl shrink-0">
            🌐
          </div>
          <div>
            <p className="font-semibold text-white text-sm">How verification works</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Each task requires a World ID proof before you can submit feedback. This ensures every response
              comes from a unique, real human — and prevents you from submitting twice on the same task.
              Your identity stays private; only a nullifier hash is stored.
            </p>
          </div>
        </div>

        {/* Open tasks */}
        {openTasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/[0.06] p-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-bold text-white mb-1">No open tasks right now</p>
            <p className="text-sm text-gray-500">Check back soon, or post a task yourself.</p>
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
            <h2 className="text-lg font-bold text-gray-500 mb-4">Closed Tasks</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
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
