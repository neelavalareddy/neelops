import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import MissingSupabaseConfig from "@/components/MissingSupabaseConfig";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import StarRating from "@/components/StarRating";
import type { Task, Response } from "@/types/database";

export const revalidate = 0;

interface Props {
  searchParams: { highlight?: string; company?: string };
}

export default async function PostedTasksPage({ searchParams }: Props) {
  const { highlight, company } = searchParams;

  if (!hasSupabaseEnv()) {
    return (
      <>
        <NavBar />
        <MissingSupabaseConfig />
      </>
    );
  }

  const supabase = createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Task[] | null };

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Response[] | null };

  const byTask: Record<string, Response[]> = {};
  for (const r of responses ?? []) {
    if (!byTask[r.task_id]) byTask[r.task_id] = [];
    byTask[r.task_id].push(r);
  }

  const filteredTasks = company
    ? (tasks ?? []).filter((t) => t.company_name.toLowerCase() === company.toLowerCase())
    : (tasks ?? []);

  const totalResponses = responses?.length ?? 0;
  const overallAvg = totalResponses > 0
    ? (responses ?? []).reduce((s, r) => s + r.rating, 0) / totalResponses
    : null;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 py-12 space-y-10">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
          <div>
            <div className="c-pill mb-3">For companies · {company ? company : "All postings"}</div>
            <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-2">
              {company ? `${company.toUpperCase()}'S TASKS` : "POSTED TASKS"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Every task on the marketplace, response counts, averages, and WLD paid out per task.
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Evaluating? Use{" "}
              <Link href="/tasks" className="underline" style={{ color: "var(--signal)" }}>Browse tasks</Link>
              {" "}and{" "}
              <Link href="/dashboard" className="underline" style={{ color: "var(--signal)" }}>Dashboard</Link>
              {" "}for your WLD history.
            </p>
          </div>
          <Link href="/post" className="c-btn-primary shrink-0 py-2.5">
            + Post New Task
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up animate-delay-100">
          <StatCard label="Total Tasks" value={filteredTasks.length} />
          <StatCard label="Open Tasks" value={filteredTasks.filter((t) => t.status === "open").length} accent="signal" />
          <StatCard label="Responses" value={totalResponses} />
          <StatCard
            label="Avg Rating"
            value={overallAvg != null ? overallAvg.toFixed(1) : "—"}
            suffix={overallAvg != null ? " ★" : ""}
            accent="gold"
          />
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ borderRadius: 20, border: "2px dashed var(--border)", padding: "64px 24px", textAlign: "center" }} className="animate-fade-up">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-display text-2xl text-white tracking-wider mb-1">NO TASKS YET</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Post your first evaluation task to get started.</p>
            <Link href="/post" className="c-btn-primary">Post a Task →</Link>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up animate-delay-200">
            {filteredTasks.map((task) => {
              const taskResponses = byTask[task.id] ?? [];
              const avg = taskResponses.length > 0
                ? taskResponses.reduce((s, r) => s + r.rating, 0) / taskResponses.length
                : null;
              const isHighlighted = task.id === highlight;

              return (
                <div
                  key={task.id}
                  className="dash-task-card"
                  style={isHighlighted ? { borderColor: "rgba(0,255,135,0.25)", boxShadow: "0 0 0 1px rgba(0,255,135,0.08)" } : {}}
                >
                  {isHighlighted && (
                    <div className="c-badge-signal mb-3 w-fit">✓ Task just posted</div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="company-av-sm">{task.company_name.charAt(0).toUpperCase()}</div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-dim)" }}>{task.company_name}</span>
                        <span className="c-badge-gold">◈ {task.bounty_wld} WLD/resp</span>
                        {task.status === "open"
                          ? <span className="c-badge-signal"><span className="c-live-dot" /> Open</span>
                          : <span className="c-badge-muted">Closed</span>
                        }
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {task.ai_output}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {avg !== null && (
                        <div className="text-center">
                          <p className="font-display text-3xl text-white leading-none mb-0.5">{avg.toFixed(1)}</p>
                          <StarRating value={Math.round(avg)} readonly size="sm" />
                        </div>
                      )}
                      <Link href={`/tasks/${task.id}`} className="c-btn-ghost py-2 text-xs">
                        View
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs pt-3 mb-4" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <span>
                      <span className="font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>{taskResponses.length}</span> responses
                    </span>
                    {avg !== null && (
                      <span>
                        <span className="font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>{avg.toFixed(2)}</span> avg
                      </span>
                    )}
                    <span>Posted {new Date(task.created_at).toLocaleDateString()}</span>
                    <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>
                      {(Number(task.bounty_wld) * taskResponses.length).toFixed(2)} WLD paid
                    </span>
                  </div>

                  {taskResponses.length > 0 && (
                    <div>
                      <div className="c-label mb-2">Recent Feedback</div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {taskResponses.slice(0, 4).map((r) => (
                          <div key={r.id} className="response-preview">
                            <div className="flex items-center justify-between mb-1.5">
                              <StarRating value={r.rating} readonly size="sm" />
                              <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs line-clamp-2" style={{ color: "var(--text-dim)" }}>{r.feedback_text}</p>
                          </div>
                        ))}
                      </div>
                      {taskResponses.length > 4 && (
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-xs mt-2 inline-block transition-colors"
                          style={{ color: "var(--signal)" }}
                        >
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

      <style>{`
        .dash-task-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px; padding: 24px;
          transition: border-color 0.2s;
        }
        .company-av-sm {
          width: 26px; height: 26px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-size: 12px; font-weight: 700;
          background: var(--signal-dim); border: 1px solid var(--signal-border);
          color: var(--signal); flex-shrink: 0;
        }
        .response-preview {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 12px;
        }
      `}</style>
    </>
  );
}

function StatCard({
  label, value, suffix = "", accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: "signal" | "gold";
}) {
  const valueColor =
    accent === "signal" ? "var(--signal)" :
    accent === "gold" ? "var(--gold)" :
    "var(--text)";

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <p className="font-display text-4xl leading-none" style={{ color: valueColor }}>
        {value}{suffix}
      </p>
    </div>
  );
}
