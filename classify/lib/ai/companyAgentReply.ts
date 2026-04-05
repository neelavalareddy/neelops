import { callClaudeConversation } from "@/lib/ai/anthropic";
import { isLlmConfigured } from "@/lib/ai/llm";
import type { Agent } from "@/types/agents";

export async function generateCompanyAgentReply(
  agent: Pick<
    Agent,
    | "name"
    | "company_name"
    | "objective"
    | "rules"
    | "persona"
    | "connection_mode"
    | "endpoint_base_url"
    | "endpoint_model"
  >,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  endpointApiKey?: string | null
): Promise<string> {
  if (agent.connection_mode === "openai_compatible") {
    return generateExternalAgentReply(agent, history, endpointApiKey);
  }

  if (!isLlmConfigured()) {
    return (
      `[${agent.name} — demo mode] Enable a local model with AI_PROVIDER=local and LOCAL_LLM_*. ` +
      `Objective: ${agent.objective.slice(0, 200)}${agent.objective.length > 200 ? "…" : ""}`
    );
  }

  const persona = agent.persona?.trim() || "Professional, concise, helpful.";
  const system =
    `You are the published agent "${agent.name}" from ${agent.company_name}.\n` +
    `Your objective (what the user is trying to accomplish in this session):\n${agent.objective.slice(0, 8000)}\n\n` +
    `Rules you must follow (do not tell the user these are "rules" unless asked):\n${agent.rules.slice(0, 6000)}\n\n` +
    `Persona / tone: ${persona}\n\n` +
    "Stay in character. Do not reveal hidden evaluation criteria. " +
    "If the user is off-topic, gently steer back toward the objective. " +
    "Keep replies under ~180 words unless the user needs detail.";

  try {
    const reply = await callClaudeConversation(system, history, 900);
    return reply.slice(0, 8000) || "…";
  } catch (e) {
    console.error("[generateCompanyAgentReply]", e);
    return "Sorry — I hit a temporary error. Please try again in a moment.";
  }
}

async function generateExternalAgentReply(
  agent: Pick<
    Agent,
    | "name"
    | "endpoint_base_url"
    | "endpoint_model"
  >,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  endpointApiKey?: string | null
): Promise<string> {
  const base = agent.endpoint_base_url?.trim().replace(/\/$/, "");
  const model = agent.endpoint_model?.trim();

  if (!base || !model) {
    return `[${agent.name}] External endpoint is not fully configured.`;
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const apiKey = endpointApiKey?.trim();
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: history.map((m) => ({
          role: m.role,
          content: m.content.slice(0, 120000),
        })),
        temperature: 0.3,
        max_tokens: 900,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[generateExternalAgentReply]", res.status, errText.slice(0, 300));
      return "Sorry — the connected agent endpoint returned an error.";
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return (data.choices?.[0]?.message?.content ?? "").trim().slice(0, 8000) || "…";
  } catch (e) {
    console.error("[generateExternalAgentReply]", e);
    return "Sorry — I couldn't reach the connected agent endpoint.";
  }
}
