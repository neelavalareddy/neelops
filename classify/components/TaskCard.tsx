import Link from "next/link";
import type { Task } from "@/types/database";

interface Props {
  task: Task;
  responseCount?: number;
  avgRating?: number | null;
  showActions?: boolean;
}

export default function TaskCard({ task, responseCount, avgRating, showActions = true }: Props) {
  const preview = task.ai_output.length > 140
    ? task.ai_output.slice(0, 140).trimEnd() + "…"
    : task.ai_output;

  const isOpen = task.status === "open";

  return (
    <div className="task-card">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="company-avatar" aria-hidden>
            {task.company_name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium truncate" style={{ color: "var(--text-dim)" }}>
            {task.company_name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="c-badge-gold">◈ {task.bounty_wld} WLD</span>
          {isOpen
            ? <span className="c-badge-signal"><span className="c-live-dot" />Open</span>
            : <span className="c-badge-muted">Closed</span>
          }
        </div>
      </div>

      {/* AI Output preview */}
      <div className="ai-preview mb-3">
        <div className="c-label" style={{ marginBottom: "6px" }}>AI OUTPUT</div>
        <p className="text-xs leading-relaxed font-mono" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {preview}
        </p>
      </div>

      {/* Criteria preview */}
      <div className="mb-4">
        <div className="c-label" style={{ marginBottom: "4px" }}>CRITERIA</div>
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {task.criteria}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {responseCount !== undefined && (
            <span className="font-mono" style={{ fontFamily: "var(--font-mono)" }}>
              {responseCount} resp
            </span>
          )}
          {avgRating != null && (
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 16 16"><polygon points="8,1 9.8,6.2 15.4,6.2 10.9,9.4 12.7,14.6 8,11.4 3.3,14.6 5.1,9.4 0.6,6.2 6.2,6.2" fill="var(--gold)" /></svg>
              <span style={{ color: "var(--gold)" }}>{avgRating.toFixed(1)}</span>
            </span>
          )}
        </div>
        {showActions && (
          isOpen
            ? <Link href={`/tasks/${task.id}`} className="c-btn-primary py-1.5 text-xs">Evaluate →</Link>
            : <Link href={`/tasks/${task.id}`} className="c-btn-ghost py-1.5 text-xs">View</Link>
        )}
      </div>

      <style>{`
        .task-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .task-card:hover {
          border-color: rgba(0,255,135,0.12);
          box-shadow: 0 0 0 1px rgba(0,255,135,0.06), 0 12px 40px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }
        .company-avatar {
          width: 24px; height: 24px;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          background: rgba(0,255,135,0.1);
          border: 1px solid rgba(0,255,135,0.15);
          color: var(--signal);
          flex-shrink: 0;
          font-family: var(--font-display);
          letter-spacing: 0;
        }
        .ai-preview {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
        }
      `}</style>
    </div>
  );
}
