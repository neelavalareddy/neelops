import { NextResponse } from "next/server";
import { createServiceClient, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import type { Agent, AgentMessage, AgentSession } from "@/types/agents";

interface Ctx {
  params: { id: string };
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const { id: agent_id } = params;
    const { nullifier_hash } = await request.json();
    if (!nullifier_hash || typeof nullifier_hash !== "string" || !nullifier_hash.trim()) {
      return NextResponse.json({ error: "nullifier_hash is required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: agent, error: aErr } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .single() as { data: Agent | null; error: unknown };

    if (aErr || !agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    if (agent.status !== "open") {
      return NextResponse.json({ error: "This agent is not accepting sessions." }, { status: 400 });
    }

    const hash = nullifier_hash.trim();

    const { data: sessionRows } = await supabase
      .from("agent_sessions")
      .select("*")
      .eq("agent_id", agent_id)
      .eq("nullifier_hash", hash)
      .limit(1);
    const existing = (sessionRows as AgentSession[] | null)?.[0] ?? null;

    let session = existing;
    if (!session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: cErr } = await (supabase as any)
        .from("agent_sessions")
        .insert({ agent_id, nullifier_hash: hash })
        .select()
        .single() as { data: AgentSession | null; error: unknown };
      if (cErr || !created) {
        return NextResponse.json({ error: "Could not start session." }, { status: 500 });
      }
      session = created;
    }

    const { data: messages } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true }) as { data: AgentMessage[] | null };

    const userIds = (messages ?? []).filter((m) => m.role === "user").map((m) => m.id);
    let evaluations: Record<string, unknown> = {};
    if (userIds.length > 0) {
      const { data: evals } = await supabase
        .from("agent_message_evaluations")
        .select("*")
        .in("message_id", userIds);
      for (const e of evals ?? []) {
        const row = e as { message_id: string };
        evaluations[row.message_id] = e;
      }
    }

    const messagesWithEval = (messages ?? []).map((m) => ({
      ...m,
      evaluation: m.role === "user" ? evaluations[m.id] ?? null : null,
    }));

    return NextResponse.json({ session, messages: messagesWithEval, agent });
  } catch (e) {
    console.error("[agent sessions POST]", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
