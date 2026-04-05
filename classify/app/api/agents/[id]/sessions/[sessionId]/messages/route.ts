import { NextResponse } from "next/server";
import { PUBLIC_AGENT_SELECT } from "@/lib/agents";
import { resolveRequestWorkerNullifier } from "@/lib/auth/requestUser";
import { generateCompanyAgentReply } from "@/lib/ai/companyAgentReply";
import { evaluateAgentUserMessage } from "@/lib/ai/classifyAgentEval";
import { createServiceClient, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import type { Agent, AgentConnectionSecret, AgentMessage, AgentSession } from "@/types/agents";

interface Ctx {
  params: { id: string; sessionId: string };
}

function transcriptBefore(messages: AgentMessage[], upToIndex: number): string {
  return messages
    .slice(0, upToIndex)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const { id: agent_id, sessionId: session_id } = params;
    const { nullifier_hash, content } = await request.json() as {
      nullifier_hash?: string;
      content?: string;
    };

    const identity = resolveRequestWorkerNullifier(nullifier_hash);
    if (!identity.nullifierHash) {
      return NextResponse.json(
        { error: identity.error ?? "Worker identity is required." },
        { status: identity.status ?? 400 }
      );
    }
    const text = typeof content === "string" ? content.trim() : "";
    if (!text || text.length > 12000) {
      return NextResponse.json({ error: "content is required (max 12000 chars)." }, { status: 400 });
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
    if (session.nullifier_hash !== identity.nullifierHash) {
      return NextResponse.json({ error: "Not your session." }, { status: 403 });
    }
    if (session.status !== "active") {
      return NextResponse.json({ error: "Session is not active." }, { status: 400 });
    }

    const { data: agent, error: aErr } = await supabase
      .from("agents")
      .select(PUBLIC_AGENT_SELECT)
      .eq("id", agent_id)
      .single() as { data: Agent | null; error: unknown };

    if (aErr || !agent || agent.status !== "open") {
      return NextResponse.json({ error: "Agent unavailable." }, { status: 400 });
    }

    const { data: prior } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true }) as { data: AgentMessage[] | null };

    const priorList = prior ?? [];
    const transcript = transcriptBefore(priorList, priorList.length);

    const evalResult = await evaluateAgentUserMessage(agent.objective, agent.rules, transcript, text);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow, error: uErr } = await (supabase as any)
      .from("agent_messages")
      .insert({ session_id, role: "user", content: text })
      .select()
      .single() as { data: AgentMessage | null; error: unknown };

    if (uErr || !userRow) {
      return NextResponse.json({ error: "Failed to save message." }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: evErr } = await (supabase as any).from("agent_message_evaluations").insert({
      message_id: userRow.id,
      relevance_1_5: evalResult.relevance_1_5,
      ai_likelihood_0_1: evalResult.ai_likelihood_0_1,
      rules_compliant: evalResult.rules_compliant,
      rationale: evalResult.rationale || null,
    });

    if (evErr) {
      console.error("[eval insert]", evErr);
    }

    const historyForAgent: Array<{ role: "user" | "assistant"; content: string }> = [
      ...priorList.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: text },
    ];

    let endpointApiKey: string | null = null;
    if (agent.connection_mode === "openai_compatible") {
      const { data: secret } = await supabase
        .from("agent_connection_secrets")
        .select("endpoint_api_key, agent_id, created_at")
        .eq("agent_id", agent_id)
        .maybeSingle() as { data: AgentConnectionSecret | null };
      endpointApiKey = secret?.endpoint_api_key ?? null;
    }

    const assistantText = await generateCompanyAgentReply(agent, historyForAgent, endpointApiKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: asstRow, error: asErr } = await (supabase as any)
      .from("agent_messages")
      .insert({ session_id, role: "assistant", content: assistantText })
      .select()
      .single() as { data: AgentMessage | null; error: unknown };

    if (asErr || !asstRow) {
      return NextResponse.json(
        { error: "User message saved but agent reply failed.", userMessage: userRow, evaluation: evalResult },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userMessage: userRow,
      evaluation: evalResult,
      assistantMessage: asstRow,
    });
  } catch (e) {
    console.error("[agent messages POST]", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
