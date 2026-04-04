import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import TaskFeedbackForm from "./TaskFeedbackForm";
import StarRating from "@/components/StarRating";
import type { Task, Response } from "@/types/database";

export const revalidate = 0;

interface Props {
  params: { id: string };
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single() as { data: Task | null; error: unknown };

  if (!task) notFound();

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: false }) as { data: Response[] | null };

  const avgRating =
    responses && responses.length > 0
      ? responses.reduce((s, r) => s + r.rating, 0) / responses.length
      : null;

  const isOpen = task.status === "open";

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* Left */}
          <div className="space-y-5 animate-fade-up">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              <a href="/tasks" style={{ color: "var(--text-muted)" }} className="hover:text-white transition-colors">Tasks</a>
              <span>/</span>
              <span>{id.slice(0, 8)}…</span>
            </div>

            {/* Task header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="company-av">{task.company_name.charAt(0).toUpperCase()}</div>
                <span className="text-sm" style={{ color: "var(--text-dim)" }}>{task.company_name}</span>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <span className="c-badge-gold">◈ {task.bounty_wld} WLD</span>
                {isOpen
                  ? <span className="c-badge-signal"><span className="c-live-dot" /> Open</span>
                  : <span className="c-badge-muted">Closed</span>
                }
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider leading-none">
                EVALUATE AI OUTPUT
              </h1>
            </div>

            {/* AI Output */}
            <div className="detail-card">
              <div className="c-label">AI Output to Evaluate</div>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "14px", border: "1px solid var(--border)" }}>
                {task.ai_output}
              </pre>
            </div>

            {/* Criteria */}
            <div className="detail-card">
              <div className="c-label">Evaluation Criteria</div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>{task.criteria}</p>
            </div>

            {/* Responses */}
            {responses && responses.length > 0 && (
              <div className="detail-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="c-label" style={{ marginBottom: 0 }}>Community Responses</div>
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(avgRating ?? 0)} readonly size="sm" />
                    <span className="font-display text-xl text-white">{avgRating?.toFixed(1)}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>({responses.length})</span>
                  </div>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {responses.map((r) => (
                    <div key={r.id} className="response-row">
                      <div className="flex items-center justify-between mb-1.5">
                        <StarRating value={r.rating} readonly size="sm" />
                        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-dim)" }}>{r.feedback_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky form */}
          <div className="lg:sticky lg:top-20 animate-fade-up animate-delay-100">
            <TaskFeedbackForm task={task} />
          </div>
        </div>
      </main>

      <style>{`
        .company-av {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-size: 13px;
          background: var(--signal-dim); border: 1px solid var(--signal-border);
          color: var(--signal); flex-shrink: 0;
        }
        .detail-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
        .response-row {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 12px;
        }
      `}</style>
    </>
  );
}
