"use client";

import ScoreBar from "./ScoreBar";
import HallucinationFlagItem from "./HallucinationFlag";
import type { SessionEvaluation, HallucinationFlag } from "@/types/agents";

interface Props {
  evaluation: SessionEvaluation;
  bounty_wld?: number;
  payout_wld?: number | null;
}

export default function SessionScoreCard({ evaluation: e, bounty_wld, payout_wld }: Props) {
  const overallPct = Math.round(Number(e.overall_score) * 100);
  const passed = e.passed;

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${passed ? "var(--pass-border)" : "var(--fail-border)"}`,
      borderTop: `3px solid ${passed ? "var(--pass)" : "var(--fail)"}`,
      borderRadius: "0 0 12px 12px",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: passed ? "var(--pass-dim)" : "var(--fail-dim)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 4,
            background: passed ? "rgba(0,200,100,0.12)" : "rgba(255,69,84,0.12)",
            color: passed ? "var(--pass)" : "var(--fail)",
            border: `1px solid ${passed ? "var(--pass-border)" : "var(--fail-border)"}`,
          }}>
            {passed ? "PASSED" : "REJECTED"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
            {overallPct}/100
          </span>
        </div>
        {passed && (payout_wld != null || bounty_wld != null) && (
          <span className="c-badge-amber">◈ {(payout_wld ?? bounty_wld ?? 0).toFixed(2)} WLD earned</span>
        )}
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Score bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ScoreBar label="Objective relevance"  score={Number(e.relevance_score)}       reason={e.relevance_reason}            passing={0.6} accentColor="var(--blue)" />
          <ScoreBar label="Rule compliance"      score={Number(e.rule_compliance_score)} reason={e.rule_compliance_reason}      passing={0.8} accentColor="var(--amber)" />
          <ScoreBar label="Human authenticity"   score={Number(e.ai_detection_score)}    reason={e.ai_detection_reason}         passing={0.7} />
          <ScoreBar label="Objective completion" score={Number(e.objective_completion)}  reason={e.objective_completion_reason} passing={0.5} />
          <ScoreBar label="Conversation depth"   score={Number(e.conversation_depth_score)} reason={e.conversation_depth_reason} accentColor="var(--text)" />
          <ScoreBar label="Edge-case coverage"   score={Number(e.edge_case_coverage_score)} reason={e.edge_case_coverage_reason} accentColor="var(--blue)" />
          <ScoreBar label="Problem discovery"    score={Number(e.problem_discovery_score)} reason={e.problem_discovery_reason} accentColor="var(--fail)" />
        </div>

        {/* Judge assessment */}
        {e.overall_assessment && (
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 6 }}>
              Judge assessment
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
              {e.overall_assessment}
            </p>
          </div>
        )}

        {/* Hallucination flags */}
        {Array.isArray(e.hallucination_flags) && e.hallucination_flags.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
              Agent hallucination flags ({e.hallucination_flags.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(e.hallucination_flags as HallucinationFlag[]).map((f, i) => (
                <HallucinationFlagItem key={i} flag={f} />
              ))}
            </div>
          </div>
        )}

        {/* Judge metadata */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
            judge: {e.judge_model}
          </span>
          {Array.isArray(e.precheck_flags) && e.precheck_flags.length > 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "var(--fail-dim)", color: "var(--fail)", border: "1px solid var(--fail-border)" }}>
              flags: {(e.precheck_flags as string[]).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
