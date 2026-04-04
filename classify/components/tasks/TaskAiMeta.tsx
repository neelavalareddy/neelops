import StarRating from "@/components/StarRating";
import type { Task, TaskInsightsJson } from "@/types/database";

function isInsights(v: unknown): v is TaskInsightsJson {
  if (!v || typeof v !== "object") return false;
  const o = v as TaskInsightsJson;
  return typeof o.summary === "string" && Array.isArray(o.themes);
}

export default function TaskAiMeta({
  task,
  avgHumanRating,
  responseCount,
}: {
  task: Task;
  avgHumanRating: number | null;
  responseCount: number;
}) {
  const pred = task.predicted_score;
  const rationale = task.prediction_rationale;
  const insights = isInsights(task.insights_json) ? task.insights_json : null;

  const delta =
    pred != null && avgHumanRating != null ? Math.round((avgHumanRating - pred) * 10) / 10 : null;

  return (
    <div className="space-y-4">
      {(pred != null || rationale) && (
        <div className="detail-card" style={{ borderColor: "rgba(0,255,135,0.12)" }}>
          <div className="c-label mb-2">AI pre-score (before humans)</div>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            A model rates the output first; human averages validate or correct it — the loop trains the scorer.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {pred != null && (
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl text-white">{pred}</span>
                <StarRating value={pred} readonly size="sm" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>predicted</span>
              </div>
            )}
            {avgHumanRating != null && (
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl" style={{ color: "var(--gold)" }}>
                  {avgHumanRating.toFixed(1)}
                </span>
                <StarRating value={Math.round(avgHumanRating)} readonly size="sm" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  humans ({responseCount})
                </span>
              </div>
            )}
            {delta != null && (
              <span
                className="text-xs font-mono px-2 py-1 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: Math.abs(delta) < 0.6 ? "var(--signal)" : "var(--gold)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)} vs model
              </span>
            )}
          </div>
          {rationale && (
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-dim)" }}>
              {rationale}
            </p>
          )}
        </div>
      )}

      {insights && (
        <div className="detail-card" style={{ borderColor: "rgba(240,180,41,0.15)" }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="c-label" style={{ marginBottom: 0 }}>Consensus insights (5+ raters)</div>
            {task.insights_generated_at && (
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {new Date(task.insights_generated_at).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>{insights.summary}</p>
          <ul className="space-y-2">
            {insights.themes.map((t, i) => (
              <li
                key={i}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}
              >
                <span className="font-semibold text-white">{t.label}</span>
                <span className="text-xs ml-2" style={{ color: "var(--gold)" }}>
                  ~{t.rater_count} raters
                </span>
                {t.detail && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t.detail}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
