"use client";

import type { HallucinationFlag as HFlag } from "@/types/agents";

interface Props {
  flag: HFlag;
}

const SEVERITY_STYLES: Record<HFlag["severity"], { bg: string; border: string; color: string; label: string }> = {
  low:      { bg: "rgba(255,214,10,0.06)",  border: "rgba(255,214,10,0.18)",  color: "var(--amber)",  label: "LOW" },
  medium:   { bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.22)",  color: "#F97316",       label: "MED" },
  high:     { bg: "rgba(255,69,84,0.09)",   border: "rgba(255,69,84,0.22)",   color: "var(--fail)",   label: "HIGH" },
  critical: { bg: "rgba(220,38,38,0.14)",   border: "rgba(220,38,38,0.30)",   color: "#EF4444",       label: "CRIT" },
};

export default function HallucinationFlag({ flag }: Props) {
  const s = SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.low;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "9px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{
        flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
        padding: "2px 6px", borderRadius: 3, background: `${s.color}22`, color: s.color, marginTop: 1,
      }}>
        {s.label}
      </span>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>Turn {flag.turn}</span>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: "3px 0 0" }}>
          {flag.claim}
        </p>
      </div>
    </div>
  );
}
