import { NextResponse } from "next/server";
import { createServiceClient, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import type { Agent, AgentMessage, AgentMessageEvaluation, AgentSession } from "@/types/agents";

interface Ctx {
  params: { id: string; sessionId: string };
}

const MIN_USER_MESSAGES = 2;
const MIN_AVG_RELEVANCE = 3;
const MAX_AI_LIKELIHOOD = 0.72;

export async function POST(request: Request, { params }: Ctx) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const { id: agent_id, sessionId: session_id } = params;
    const { nullifier_hash } = await request.json() as { nullifier_hash?: string };

    if (!nullifier_hash?.trim()) {
      return NextResponse.json({ error: "nullifier_hash is required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: session, error: sErr } = await supabase
      .from("agent_sessions")
      .select("*")
      .eq("id", session_id)
      .single() as { data: AgentSession | null; error: unknown };

    if (sErr || !session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (session.agent_id !== agent_id) {
      return NextResponse.json({ error: "Session mismatch." }, { status: 400 });
    }
    if (session.nullifier_hash !== nullifier_hash.trim()) {
      return NextResponse.json({ error: "Not your session." }, { status: 403 });
    }
    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session already finalized.", status: session.status },
        { status: 400 }
      );
    }

    const { data: userMsgs } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("session_id", session_id)
      .eq("role", "user")
      .order("created_at", { ascending: true }) as { data: AgentMessage[] | null };

    const users = userMsgs ?? [];
    if (users.length < MIN_USER_MESSAGES) {
      return NextResponse.json(
        {
          ok: false,
          reason: `Need at least ${MIN_USER_MESSAGES} user messages before requesting payout.`,
        },
        { status: 400 }
      );
    }

    const ids = users.map((m) => m.id);
    const { data: evalRows } = await supabase
      .from("agent_message_evaluations")
      .select("*")
      .in("message_id", ids) as { data: AgentMessageEvaluation[] | null };

    const byId = Object.fromEntries((evalRows ?? []).map((e) => [e.message_id, e]));
    const missing = users.filter((m) => !byId[m.id]);
    if (missing.length > 0) {
      return NextResponse.json({ ok: false, reason: "Some messages are not evaluated yet." }, { status: 500 });
    }

    const evs = users.map((m) => byId[m.id]!);
    const anyRuleBreak = evs.some((e) => !e.rules_compliant);
    const avgRel = evs.reduce((s, e) => s + e.relevance_1_5, 0) / evs.length;
    const maxAi = Math.max(...evs.map((e) => Number(e.ai_likelihood_0_1)));

    const failures: string[] = [];
    if (anyRuleBreak) failures.push("One or more messages broke stated rules.");
    if (avgRel < MIN_AVG_RELEVANCE) {
      failures.push(
        `Average relevance ${avgRel.toFixed(2)} is below required ${MIN_AVG_RELEVANCE}.`
      );
    }
    if (maxAi > MAX_AI_LIKELIHOOD) {
      failures.push(
        `AI-likelihood too high on at least one turn (max ${maxAi.toFixed(2)} > ${MAX_AI_LIKELIHOOD}).`
      );
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("bounty_wld")
      .eq("id", agent_id)
      .single() as { data: Pick<Agent, "bounty_wld"> | null };

    const bounty = agent?.bounty_wld ?? 0;

    if (failures.length > 0) {
      const note = failures.join(" ");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("agent_sessions")
        .update({ status: "rejected", payout_note: note })
        .eq("id", session_id);

      return NextResponse.json({
        ok: false,
        status: "rejected",
        reasons: failures,
        payout_note: note,
        bounty_wld: bounty,
      });
    }

    const note = "Passed Classify checks — bounty eligible (WLD transfer still mocked in this app).";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("agent_sessions")
      .update({ status: "eligible", payout_note: note })
      .eq("id", session_id);

    return NextResponse.json({
      ok: true,
      status: "eligible",
      payout_note: note,
      bounty_wld: bounty,
    });
  } catch (e) {
    console.error("[agent complete POST]", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
