import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import ScoreBar from "@/components/evaluation/ScoreBar";
import type { Agent, AgentSession, SessionEvaluation, HallucinationFlag } from "@/types/agents";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

interface AgentReportData {
  agent: Agent;
  totalSessions: number;
  passedSessions: number;
  rejectedSessions: number;
  passRate: number;
  avgOverallScore: number;
  avgRelevance: number;
  avgRuleCompliance: number;
  avgAiDetection: number;
  avgObjectiveCompletion: number;
  hallucinationRate: number;
  topHallucinations: Array<{
    claim: string;
    severity: HallucinationFlag["severity"];
    occurrences: number;
    sessions: number;
  }>;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  recentSessions: Array<{
    session: AgentSession;
    evaluation: SessionEvaluation | null;
  }>;
}

async function getReport(id: string): Promise<AgentReportData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient();

  const { data: agent } = (await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single()) as { data: Agent | null; error: unknown };

  if (!agent) return null;

  const { data: sessions } = (await supabase
    .from("agent_sessions")
    .select("*")
    .eq("agent_id", id)
    .neq("status", "active")
    .order("created_at", { ascending: false })) as { data: AgentSession[] | null };

  const allSessions = sessions ?? [];
  if (allSessions.length === 0) {
    return {
      agent,
      totalSessions: 0,
      passedSessions: 0,
      rejectedSessions: 0,
      passRate: 0,
      avgOverallScore: 0,
      avgRelevance: 0,
      avgRuleCompliance: 0,
      avgAiDetection: 0,
      avgObjectiveCompletion: 0,
      hallucinationRate: 0,
      topHallucinations: [],
      scoreDistribution: [],
      recentSessions: [],
    };
  }

  const sessionIds = allSessions.map((s) => s.id);
  const { data: evals } = (await supabase
    .from("session_evaluations")
    .select("*")
    .in("session_id", sessionIds)) as { data: SessionEvaluation[] | null };

  const evalMap = Object.fromEntries((evals ?? []).map((e) => [e.session_id, e]));
  const evalList = evals ?? [];
  const passedCount = allSessions.filter((s) => s.status === "eligible").length;
  const rejectedCount = allSessions.filter((s) => s.status === "rejected").length;

  function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  const avgOverall = avg(evalList.map((e) => Number(e.overall_score)));
  const avgRel = avg(evalList.map((e) => Number(e.relevance_score)));
  const avgRule = avg(evalList.map((e) => Number(e.rule_compliance_score)));
  const avgAi = avg(evalList.map((e) => Number(e.ai_detection_score)));
  const avgObj = avg(evalList.map((e) => Number(e.objective_completion)));

  const allFlags: Array<HallucinationFlag & { sessionId: string }> = [];
  for (const e of evalList) {
    const flags = Array.isArray(e.hallucination_flags) ? (e.hallucination_flags as HallucinationFlag[]) : [];
    for (const f of flags) {
      allFlags.push({ ...f, sessionId: e.session_id });
    }
  }

  const sessionsWithHallucinations = new Set(allFlags.map((f) => f.sessionId)).size;
  const hallucinationRate = evalList.length > 0 ? sessionsWithHallucinations / evalList.length : 0;

  const claimMap = new Map<
    string,
    { claim: string; severity: HallucinationFlag["severity"]; count: number; sessionSet: Set<string> }
  >();
  for (const f of allFlags) {
    const key = f.claim.toLowerCase().trim().slice(0, 100);
    const existing = claimMap.get(key);
    if (existing) {
      existing.count++;
      existing.sessionSet.add(f.sessionId);
      const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      if (severityOrder[f.severity] > severityOrder[existing.severity]) {
        existing.severity = f.severity;
      }
    } else {
      claimMap.set(key, {
        claim: f.claim,
        severity: f.severity,
        count: 1,
        sessionSet: new Set([f.sessionId]),
      });
    }
  }

  const topHallucinations = Array.from(claimMap.values())
    .sort((a, b) => b.count - a.count || (b.severity > a.severity ? 1 : -1))
    .slice(0, 10)
    .map((h) => ({
      claim: h.claim,
      severity: h.severity,
      occurrences: h.count,
      sessions: h.sessionSet.size,
    }));

  const buckets = ["0.0–0.2", "0.2–0.4", "0.4–0.6", "0.6–0.8", "0.8–1.0"];
  const bucketCounts = [0, 0, 0, 0, 0];
  for (const e of evalList) {
    const s = Number(e.overall_score);
    const idx = Math.min(4, Math.floor(s / 0.2));
    bucketCounts[idx]++;
  }
  const scoreDistribution = buckets.map((bucket, i) => ({ bucket, count: bucketCounts[i] }));

  return {
    agent,
    totalSessions: allSessions.length,
    passedSessions: passedCount,
    rejectedSessions: rejectedCount,
    passRate: allSessions.length > 0 ? passedCount / allSessions.length : 0,
    avgOverallScore: Math.round(avgOverall * 1000) / 1000,
    avgRelevance: Math.round(avgRel * 1000) / 1000,
    avgRuleCompliance: Math.round(avgRule * 1000) / 1000,
    avgAiDetection: Math.round(avgAi * 1000) / 1000,
    avgObjectiveCompletion: Math.round(avgObj * 1000) / 1000,
    hallucinationRate: Math.round(hallucinationRate * 1000) / 1000,
    topHallucinations,
    scoreDistribution,
    recentSessions: allSessions.slice(0, 20).map((s) => ({
      session: s,
      evaluation: evalMap[s.id] ?? null,
    })),
  };
}

const SEVERITY_COLOR: Record<string, string> = {
  low: "var(--amber)", medium: "#F97316", high: "var(--fail)", critical: "#EF4444",
};

export default async function AgentReportPage({ params }: Props) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const {
    agent, totalSessions, passedSessions, passRate, avgOverallScore,
    avgRelevance, avgRuleCompliance, avgAiDetection, avgObjectiveCompletion,
    hallucinationRate, topHallucinations, scoreDistribution, recentSessions,
  } = report;

  const overallPct   = Math.round(avgOverallScore * 100);
  const passRatePct  = Math.round(passRate * 100);
  const hallRatePct  = Math.round(hallucinationRate * 100);
  const maxBucket    = Math.max(...scoreDistribution.map((b) => b.count), 1);

  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
          <Link href="/agents" style={{ color: "var(--text-3)", textDecoration: "none" }}>Agents</Link>
          <span>/</span>
          <Link href={`/agents/${agent.id}`} style={{ color: "var(--text-3)", textDecoration: "none" }}>{agent.name}</Link>
          <span>/</span>
          <span style={{ color: "var(--text-2)" }}>Evaluation Report</span>
        </div>

        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)" }}>{agent.company_name}</span>
            <div className="c-badge-amber">◈ {agent.bounty_wld} WLD / session</div>
            {agent.status === "open"
              ? <div className="c-badge-pass"><span className="c-live-dot" style={{ width: 5, height: 5 }} />Open</div>
              : <div className="c-badge-muted">Closed</div>
            }
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.05, marginBottom: 6 }}>
            {agent.name}
          </h1>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Evaluation Report · {totalSessions} completed session{totalSessions !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Summary stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { label: "Overall score",       value: `${overallPct}/100`,              color: overallPct >= 60 ? "var(--pass)" : "var(--fail)" },
            { label: "Pass rate",            value: `${passRatePct}%`,               color: passRatePct >= 60 ? "var(--pass)" : "var(--fail)" },
            { label: "Hallucination rate",   value: `${hallRatePct}%`,               color: hallRatePct > 20 ? "var(--fail)" : hallRatePct > 5 ? "#F97316" : "var(--pass)" },
            { label: "Sessions passed",      value: `${passedSessions} / ${totalSessions}`, color: "var(--text)" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Criteria averages */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-3)", marginBottom: 16 }}>
            Average scores — all sessions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <ScoreBar label="Objective relevance"  score={avgRelevance}           passing={0.6} accentColor="var(--blue)" />
            <ScoreBar label="Rule compliance"      score={avgRuleCompliance}      passing={0.8} accentColor="var(--amber)" />
            <ScoreBar label="Human authenticity"   score={avgAiDetection}         passing={0.7} />
            <ScoreBar label="Objective completion" score={avgObjectiveCompletion} passing={0.5} />
          </div>
        </div>

        {/* Score distribution */}
        {scoreDistribution.some((b) => b.count > 0) && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-3)", marginBottom: 16 }}>
              Score distribution
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {scoreDistribution.map((bucket) => {
                const h = Math.max((bucket.count / maxBucket) * 100, bucket.count > 0 ? 8 : 0);
                const isPass = bucket.bucket === "0.6–0.8" || bucket.bucket === "0.8–1.0";
                return (
                  <div key={bucket.bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    {bucket.count > 0 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>{bucket.count}</span>
                    )}
                    <div style={{ width: "100%", height: `${h}%`, background: isPass ? "var(--pass)" : "var(--text-3)", borderRadius: "3px 3px 0 0", opacity: 0.75, minHeight: bucket.count > 0 ? 4 : 0 }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-3)" }}>{bucket.bucket}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top hallucinations */}
        {topHallucinations.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--fail-border)", borderTop: "2px solid var(--fail)", borderRadius: "0 0 12px 12px", padding: "20px 22px" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fail)", marginBottom: 4 }}>
                Top hallucinations detected
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                Claims the agent made that appear fabricated, unsupported, or contradictory.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topHallucinations.map((h, i) => (
                <div key={i} style={{ background: "var(--fail-dim)", border: "1px solid var(--fail-border)", borderRadius: 6, padding: "10px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: `${SEVERITY_COLOR[h.severity]}22`, color: SEVERITY_COLOR[h.severity] }}>
                      {h.severity.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>×{h.sessions}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>{h.claim}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>
                      {h.occurrences} occurrence{h.occurrences !== 1 ? "s" : ""} · {h.sessions} session{h.sessions !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-3)", marginBottom: 14 }}>
              Recent sessions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentSessions.map(({ session, evaluation: ev }) => (
                <div key={session.id} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                      background: session.status === "eligible" ? "var(--pass-dim)" : "var(--fail-dim)",
                      color: session.status === "eligible" ? "var(--pass)" : "var(--fail)",
                      border: `1px solid ${session.status === "eligible" ? "var(--pass-border)" : "var(--fail-border)"}`,
                    }}>
                      {session.status === "eligible" ? "PASS" : "FAIL"}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {session.id.slice(0, 8)}…
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    {ev && (
                      <>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
                          {Math.round(Number(ev.overall_score) * 100)}/100
                        </span>
                        {Array.isArray(ev.hallucination_flags) && ev.hallucination_flags.length > 0 && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "var(--fail-dim)", color: "var(--fail)", border: "1px solid var(--fail-border)" }}>
                            {ev.hallucination_flags.length} halluc.
                          </span>
                        )}
                      </>
                    )}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalSessions === 0 && (
          <div style={{ border: "1px dashed var(--border-2)", borderRadius: 12, padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, color: "var(--text)", marginBottom: 8 }}>No completed sessions yet</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>
              Testers need to complete at least one session before data appears here.
            </p>
            <Link href={`/agents/${agent.id}`} className="c-btn-primary" style={{ padding: "9px 20px", fontSize: 12 }}>
              View agent →
            </Link>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/agents/${agent.id}`} className="c-btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>← Agent detail</Link>
          <Link href="/agents" className="c-btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>All agents</Link>
        </div>

      </main>
    </>
  );
}
