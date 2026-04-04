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

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* Left: task info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-[#7C6FFF]/20 flex items-center justify-center text-xs font-bold text-[#7C6FFF]">
                  {task.company_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-400">{task.company_name}</span>
                <span className="text-gray-700">·</span>
                <span className="wld-badge">◈ {task.bounty_wld} WLD</span>
                {task.status === "open" ? (
                  <span className="verified-badge">● Open</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 px-3 py-1 text-xs font-semibold text-gray-500">Closed</span>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Evaluate AI Output
              </h1>
            </div>

            {/* AI Output */}
            <div className="glass-card p-6 space-y-3">
              <p className="label">AI Output to Evaluate</p>
              <pre className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed font-mono bg-white/[0.02] rounded-xl p-4 overflow-x-auto">
                {task.ai_output}
              </pre>
            </div>

            {/* Criteria */}
            <div className="glass-card p-6 space-y-3">
              <p className="label">Evaluation Criteria</p>
              <p className="text-sm text-gray-300 leading-relaxed">{task.criteria}</p>
            </div>

            {/* Responses summary */}
            {responses && responses.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="label mb-0">Community Responses</p>
                  <div className="flex items-center gap-2 text-sm">
                    <StarRating value={Math.round(avgRating ?? 0)} readonly size="sm" />
                    <span className="font-bold text-white">{avgRating?.toFixed(1)}</span>
                    <span className="text-gray-500">({responses.length})</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {responses.map((r) => (
                    <div key={r.id} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <StarRating value={r.rating} readonly size="sm" />
                        <span className="text-xs text-gray-600">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{r.feedback_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: feedback form */}
          <div className="lg:sticky lg:top-20">
            <TaskFeedbackForm task={task} />
          </div>
        </div>
      </main>
    </>
  );
}
