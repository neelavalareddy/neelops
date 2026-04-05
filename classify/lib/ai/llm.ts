/**
 * Routes inference to Anthropic (cloud) or a local OpenAI-compatible server (Ollama, LM Studio, vLLM, etc.).
 *
 * Local: set AI_PROVIDER=local and LOCAL_LLM_BASE_URL (e.g. http://127.0.0.1:11434/v1 for Ollama).
 */

export type AiProvider = "anthropic" | "local";

export function getAiProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (explicit === "local") return "local";
  if (explicit === "anthropic") return "anthropic";
  if (process.env.LOCAL_LLM_BASE_URL?.trim()) return "local";
  return "anthropic";
}

/** True if the active provider has minimum config to call the API. */
export function isLlmConfigured(): boolean {
  if (getAiProvider() === "local") {
    return Boolean(process.env.LOCAL_LLM_BASE_URL?.trim() && process.env.LOCAL_LLM_MODEL?.trim());
  }
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

async function anthropicMessages(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content.slice(0, 120000) })),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return (data.content?.find((b) => b.type === "text")?.text ?? "").trim();
}

async function openAiCompatibleChat(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number
): Promise<string> {
  const base = process.env.LOCAL_LLM_BASE_URL?.replace(/\/$/, "") ?? "";
  const model = process.env.LOCAL_LLM_MODEL?.trim();
  if (!base || !model) {
    throw new Error("LOCAL_LLM_BASE_URL and LOCAL_LLM_MODEL are required for local inference.");
  }

  const url = `${base}/chat/completions`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  const apiKey = process.env.LOCAL_LLM_API_KEY?.trim();
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  const openaiMessages = [
    { role: "system" as const, content: system.slice(0, 120000) },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, 120000),
    })),
  ];

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Local LLM ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

export async function callLlmSingleTurn(
  system: string,
  user: string,
  maxTokens = 1024
): Promise<string> {
  const provider = getAiProvider();
  if (provider === "local") {
    return openAiCompatibleChat(system, [{ role: "user", content: user }], maxTokens);
  }
  return anthropicMessages(system, [{ role: "user", content: user }], maxTokens);
}

export async function callLlmMultiTurn(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens = 1024
): Promise<string> {
  const provider = getAiProvider();
  if (provider === "local") {
    return openAiCompatibleChat(system, messages, maxTokens);
  }
  return anthropicMessages(system, messages, maxTokens);
}
