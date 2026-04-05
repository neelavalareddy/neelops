import { NextResponse } from "next/server";
import { createServiceClient, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import { judgeSession } from "@/lib/ai/judge/engine";
import type { Agent, AgentMessage, AgentSession } from "@/types/agents";

interface Ctx {
  params: { id: string; sessionId: string };
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const { id: agent_id, sessionId: session_id } = params;
    const { nullifier_hash } = (await request.json()) as { nullifier_hash?: string };

    if (!nullifier_hash?.trim()) {
      return NextResponse.json({ error: "nullifier_hash is required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: session, error: sErr } = (await supabase
      .from("agent_sessions")
      .select("*")
      .eq("id", session_id)
      .single()) as { data: AgentSession | null; error: unknown };

    if (sErr || !session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (session.agent_id !== agent_id)
      return NextResponse.json({ error: "Session mismatch." }, { status: 400 });
    if (session.nullifier_hash !== nullifier_hash.trim())
      return NextResponse.json({ error: "Not your session." }, { status: 403 });
    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session already finalized.", status: session.status },
        { status: 400 }
      );
    }

    const { data: agent } = (await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .single()) as { data: Agent | null; error: unknown };

    if (!agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });

    const { data: allMsgs } = (await supabase
      .from("agent_messages")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })) as { data: AgentMessage[] | null };

    const allMessages = allMsgs ?? [];
    const userMessages = allMessages.filter((m) => m.role === "user");

    const result = await judgeSession(agent, allMessages, userMessages);

    const newStatus = result.passed ? "eligible" : "rejected";
    const payout_note = result.passed
      ? `Passed Classify judge (score ${(result.overall_score * 10).toFixed(1)}/10) — bounty eligible.`
      : `Rejected: ${result.overall_assessment?.slice(0, 200) ?? "Did not meet passing criteria."}`;

    // Persist evaluation and update session status in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Promise.all([
      (supabase as any).from("session_evaluations").upsert({
        session_id,
        relevance_score: result.relevance_score,
        relevance_reason: result.relevance_reason,
        rule_compliance_score: result.rule_compliance_score,
        rule_compliance_reason: result.rule_compliance_reason,
        ai_detection_score: result.ai_detection_score,
        ai_detection_reason: result.ai_detection_reason,
        objective_completion: result.objective_completion,
        objective_completion_reason: result.objective_completion_reason,
        hallucination_flags: result.hallucination_flags,
        overall_score: result.overall_score,
        overall_assessment: result.overall_assessment,
        passed: result.passed,
        judge_model: result.judge_model,
        judge_reasoning: result.judge_reasoning,
        secondary_judge_model: result.secondary_judge_model,
        secondary_judge_agreed: result.secondary_judge_agreed,
        precheck_flags: result.precheck_flags,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("agent_sessions")
        .update({ status: newStatus, payout_note })
        .eq("id", session_id),
    ]);

    // Update agent-level stats after session is finalized
    if (result.passed) {
      const { data: eligibleSessions } = await supabase
        .from("agent_sessions")
        .select("id")
        .eq("agent_id", agent_id)
        .eq("status", "eligible");

      const passedSessionIds = (eligibleSessions ?? []).map((s: { id: string }) => s.id);
      const completedCount = passedSessionIds.length;

      let newAvgScore = result.overall_score;
      if (passedSessionIds.length > 0) {
        const { data: scores } = await supabase
          .from("session_evaluations")
          .select("overall_score")
          .in("session_id", passedSessionIds);

        const allScores = (scores ?? []).map((r: { overall_score: number }) => Number(r.overall_score));
        if (allScores.length > 0) {
          newAvgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("agents")
        .update({
          tests_completed: completedCount,
          avg_score: Math.round(newAvgScore * 1000) / 1000,
        })
        .eq("id", agent_id);
    }

    return NextResponse.json({
      ok: result.passed,
      status: newStatus,
      payout_note,
      bounty_wld: agent.bounty_wld,
      evaluation: {
        relevance_score: result.relevance_score,
        rule_compliance_score: result.rule_compliance_score,
        ai_detection_score: result.ai_detection_score,
        objective_completion: result.objective_completion,
        hallucination_flags: result.hallucination_flags,
        overall_score: result.overall_score,
        overall_assessment: result.overall_assessment,
        passed: result.passed,
        judge_model: result.judge_model,
        secondary_judge_model: result.secondary_judge_model,
        secondary_judge_agreed: result.secondary_judge_agreed,
        precheck_flags: result.precheck_flags,
      },
    });
  } catch (e) {
    console.error("[agent complete POST]", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
