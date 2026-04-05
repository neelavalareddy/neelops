"use client";

interface Props {
  label: string;
  score: number; // 0–1
  reason?: string | null;
  passing?: number; // threshold line (0–1), e.g. 0.6
  accentColor?: string;
}

function scoreColor(score: number, passing: number): string {
  if (score >= passing) return "var(--pass)";
  if (score >= passing * 0.7) return "var(--amber)";
  return "var(--fail)";
}

export default function ScoreBar({ label, score, reason, passing = 0.6, accentColor }: Props) {
  const pct = Math.round(score * 100);
  const color = accentColor ?? scoreColor(score, passing);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            width: `${pct}%`,
            background: color,
            transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      {reason && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
          {reason}
        </p>
      )}
    </div>
  );
}
