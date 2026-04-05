import { NextResponse } from "next/server";
import { PUBLIC_AGENT_SELECT } from "@/lib/agents";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Agent, AgentSession, SessionEvaluation, HallucinationFlag } from "@/types/agents";

interface Ctx {
  params: { id: string };
}

export interface AgentReportData {
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

export async function GET(_req: Request, { params }: Ctx) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const supabase = createClient();
  const { id: agent_id } = params;

  const { data: agent } = (await supabase
    .from("agents")
    .select(PUBLIC_AGENT_SELECT)
    .eq("id", agent_id)
    .single()) as { data: Agent | null; error: unknown };

  if (!agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });

  // Fetch all non-active sessions
  const { data: sessions } = (await supabase
    .from("agent_sessions")
    .select("*")
    .eq("agent_id", agent_id)
    .neq("status", "active")
    .order("created_at", { ascending: false })) as { data: AgentSession[] | null };

  const allSessions = sessions ?? [];
  if (allSessions.length === 0) {
    return NextResponse.json({
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
    } satisfies AgentReportData);
  }

  // Fetch evaluations for these sessions
  const sessionIds = allSessions.map((s) => s.id);
  const { data: evals } = (await supabase
    .from("session_evaluations")
    .select("*")
    .in("session_id", sessionIds)) as { data: SessionEvaluation[] | null };

  const evalMap = Object.fromEntries((evals ?? []).map((e) => [e.session_id, e]));

  const evalList = (evals ?? []) as SessionEvaluation[];
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

  // Hallucination analysis
  const allFlags: Array<HallucinationFlag & { sessionId: string }> = [];
  for (const e of evalList) {
    const flags = Array.isArray(e.hallucination_flags) ? (e.hallucination_flags as HallucinationFlag[]) : [];
    for (const f of flags) {
      allFlags.push({ ...f, sessionId: e.session_id });
    }
  }

  const sessionsWithHallucinations = new Set(allFlags.map((f) => f.sessionId)).size;
  const hallucinationRate =
    evalList.length > 0 ? sessionsWithHallucinations / evalList.length : 0;

  // Deduplicate and count hallucinations by normalized claim
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
      // Escalate severity if higher
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

  // Score distribution (0.0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
  const buckets = ["0.0–0.2", "0.2–0.4", "0.4–0.6", "0.6–0.8", "0.8–1.0"];
  const bucketCounts = [0, 0, 0, 0, 0];
  for (const e of evalList) {
    const s = Number(e.overall_score);
    const idx = Math.min(4, Math.floor(s / 0.2));
    bucketCounts[idx]++;
  }
  const scoreDistribution = buckets.map((bucket, i) => ({ bucket, count: bucketCounts[i] }));

  // Recent sessions with their evaluations (last 20)
  const recentSessions = allSessions.slice(0, 20).map((s) => ({
    session: s,
    evaluation: evalMap[s.id] ?? null,
  }));

  return NextResponse.json({
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
    recentSessions,
  } satisfies AgentReportData);
}
