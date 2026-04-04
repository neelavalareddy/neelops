import { callClaudeConversation, isAnthropicConfigured } from "@/lib/ai/anthropic";
import type { Agent } from "@/types/agents";

export async function generateCompanyAgentReply(
  agent: Pick<Agent, "name" | "company_name" | "objective" | "rules" | "persona">,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  if (!isAnthropicConfigured()) {
    return (
      `[${agent.name} — demo mode] Enable ANTHROPIC_API_KEY for a live agent. ` +
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
