import Link from "next/link";
import type { Task } from "@/types/database";

interface Props {
  task: Task;
  responseCount?: number;
  avgRating?: number | null;
  showActions?: boolean;
}

export default function TaskCard({ task, responseCount, avgRating, showActions = true }: Props) {
  const preview = task.ai_output.length > 160
    ? task.ai_output.slice(0, 160).trimEnd() + "…"
    : task.ai_output;

  return (
    <div className="glass-card-hover p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-[#7C6FFF]/20 flex items-center justify-center text-xs font-bold text-[#7C6FFF] shrink-0">
              {task.company_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-400 truncate">{task.company_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="wld-badge">
            ◈ {task.bounty_wld} WLD
          </span>
          {task.status === "open" ? (
            <span className="verified-badge">● Open</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 px-3 py-1 text-xs font-semibold text-gray-500">
              Closed
            </span>
          )}
        </div>
      </div>

      {/* AI output preview */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-2">AI Output</p>
        <p className="text-sm text-gray-300 leading-relaxed font-mono">{preview}</p>
      </div>

      {/* Criteria preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1">Evaluation Criteria</p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{task.criteria}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {responseCount !== undefined && (
            <span>{responseCount} response{responseCount !== 1 ? "s" : ""}</span>
          )}
          {avgRating != null && (
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              {avgRating.toFixed(1)} avg
            </span>
          )}
        </div>
        {showActions && task.status === "open" && (
          <Link href={`/tasks/${task.id}`} className="btn-primary py-2 text-xs">
            Evaluate →
          </Link>
        )}
        {showActions && task.status === "closed" && (
          <Link href={`/tasks/${task.id}`} className="btn-ghost py-2 text-xs">
            View responses
          </Link>
        )}
      </div>
    </div>
  );
}
