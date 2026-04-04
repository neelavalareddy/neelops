import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import StarRating from "@/components/StarRating";
import type { Task, Response } from "@/types/database";

export const revalidate = 0;

interface Props {
  searchParams: { highlight?: string; company?: string };
}

export default async function DashboardPage({ searchParams }: Props) {
  const { highlight, company } = await searchParams;
  const supabase = createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Task[] | null };

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Response[] | null };

  // Group responses by task
  const byTask: Record<string, Response[]> = {};
  for (const r of responses ?? []) {
    if (!byTask[r.task_id]) byTask[r.task_id] = [];
    byTask[r.task_id].push(r);
  }

  const filteredTasks = company
    ? (tasks ?? []).filter((t) => t.company_name.toLowerCase() === company.toLowerCase())
    : (tasks ?? []);

  const totalResponses = responses?.length ?? 0;
  const totalBountyPaid = (responses ?? [])
    .filter((r) => r.paid)
    .reduce((s) => s, 0);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="section-pill mb-3">
              {company ? `${company} Dashboard` : "All Tasks"}
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {company ? `${company}'s Tasks` : "Company Dashboard"}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              View evaluation results and feedback from verified humans.
            </p>
          </div>
          <Link href="/post" className="btn-primary shrink-0 py-2.5">
            + Post New Task
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Tasks" value={filteredTasks.length} />
          <StatCard label="Open Tasks" value={filteredTasks.filter((t) => t.status === "open").length} accent="verified" />
          <StatCard label="Total Responses" value={totalResponses} />
          <StatCard label="Avg Rating" value={
            totalResponses > 0
              ? ((responses ?? []).reduce((s, r) => s + r.rating, 0) / totalResponses).toFixed(1) + " ★"
              : "—"
          } />
        </div>

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/[0.06] p-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold text-white mb-1">No tasks yet</p>
            <p className="text-sm text-gray-500 mb-6">Post your first evaluation task to get started.</p>
            <Link href="/post" className="btn-primary">Post a Task →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const taskResponses = byTask[task.id] ?? [];
              const avg = taskResponses.length > 0
                ? taskResponses.reduce((s, r) => s + r.rating, 0) / taskResponses.length
                : null;
              const isHighlighted = task.id === highlight;

              return (
                <div
                  key={task.id}
                  className={`glass-card p-6 space-y-5 ${isHighlighted ? "border-[#7C6FFF]/40 ring-1 ring-[#7C6FFF]/20" : ""}`}
                >
                  {isHighlighted && (
                    <div className="verified-badge w-fit">✓ Task just posted</div>
                  )}

                  {/* Task header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="h-7 w-7 rounded-lg bg-[#7C6FFF]/20 flex items-center justify-center text-xs font-bold text-[#7C6FFF] shrink-0">
                          {task.company_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-400 font-medium">{task.company_name}</span>
                        <span className="wld-badge">◈ {task.bounty_wld} WLD/response</span>
                        {task.status === "open" ? (
                          <span className="verified-badge">● Open</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 px-3 py-1 text-xs font-semibold text-gray-500">Closed</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-mono line-clamp-2">{task.ai_output}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {avg !== null && (
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">{avg.toFixed(1)}</p>
                          <StarRating value={Math.round(avg)} readonly size="sm" />
                        </div>
                      )}
                      <Link href={`/tasks/${task.id}`} className="btn-ghost py-2 text-xs">
                        View
                      </Link>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-2 border-t border-white/[0.05]">
                    <span className="font-semibold text-white">{taskResponses.length}</span> responses
                    {avg !== null && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="font-semibold text-white">{avg.toFixed(2)}</span> avg rating
                      </>
                    )}
                    <span className="text-gray-700">·</span>
                    <span>Posted {new Date(task.created_at).toLocaleDateString()}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-[#F5C842] font-semibold">
                      {(task.bounty_wld * taskResponses.length).toFixed(2)} WLD paid out
                    </span>
                  </div>

                  {/* Responses preview */}
                  {taskResponses.length > 0 && (
                    <div className="space-y-2">
                      <p className="label">Recent Feedback</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {taskResponses.slice(0, 4).map((r) => (
                          <div key={r.id} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <StarRating value={r.rating} readonly size="sm" />
                              <span className="text-xs text-gray-700">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">{r.feedback_text}</p>
                          </div>
                        ))}
                      </div>
                      {taskResponses.length > 4 && (
                        <Link href={`/tasks/${task.id}`} className="text-xs text-[#7C6FFF] hover:text-[#B8AEFF] transition-colors">
                          View all {taskResponses.length} responses →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "verified" | "wld" }) {
  const valueColor = accent === "verified" ? "text-[#22C55E]" : accent === "wld" ? "text-[#F5C842]" : "text-white";
  return (
    <div className="glass-card p-5 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">{label}</p>
      <p className={`text-3xl font-black ${valueColor}`}>{value}</p>
    </div>
  );
}
