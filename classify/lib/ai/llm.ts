/**
 * Routes inference to Anthropic (cloud) or any OpenAI-compatible endpoint.
 *
 * Supported env styles:
 * - Legacy/local: AI_PROVIDER=local with LOCAL_LLM_*
 * - Hosted OpenAI-compatible: AI_PROVIDER=openai_compatible with OPENAI_COMPATIBLE_*
 * - Groq convenience: AI_PROVIDER=groq with GROQ_API_KEY (+ optional GROQ_MODEL)
 */

export type AiProvider = "anthropic" | "openai_compatible";

function isLoopbackHost(value: string): boolean {
  return /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(value.trim());
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL?.trim() || process.env.VERCEL_ENV?.trim());
}

export function getAiProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (explicit === "local" || explicit === "openai_compatible" || explicit === "groq") {
    return "openai_compatible";
  }
  if (explicit === "anthropic") return "anthropic";
  if (getOpenAiCompatibleBaseUrl()) return "openai_compatible";
  return "anthropic";
}

/** True if the active provider has minimum config to call the API. */
export function isLlmConfigured(): boolean {
  if (getAiProvider() === "openai_compatible") {
    const base = getOpenAiCompatibleBaseUrl();
    if (!base || !getOpenAiCompatibleModel()) return false;
    if (isVercelRuntime() && isLoopbackHost(base)) return false;
    return true;
  }
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getOpenAiCompatibleBaseUrl(): string | null {
  const explicit = process.env.OPENAI_COMPATIBLE_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.AI_PROVIDER?.toLowerCase().trim() === "groq") {
    return "https://api.groq.com/openai/v1";
  }

  const legacy = process.env.LOCAL_LLM_BASE_URL?.trim();
  return legacy ? legacy.replace(/\/$/, "") : null;
}

export function getOpenAiCompatibleModel(): string | null {
  if (process.env.AI_PROVIDER?.toLowerCase().trim() === "groq") {
    const groqModel = process.env.GROQ_MODEL?.trim();
    if (groqModel) return groqModel;
  }

  return (
    process.env.OPENAI_COMPATIBLE_MODEL?.trim() ||
    process.env.LOCAL_LLM_MODEL?.trim() ||
    null
  );
}

function getOpenAiCompatibleApiKey(): string | null {
  if (process.env.AI_PROVIDER?.toLowerCase().trim() === "groq") {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) return groqKey;
  }

  return (
    process.env.OPENAI_COMPATIBLE_API_KEY?.trim() ||
    process.env.LOCAL_LLM_API_KEY?.trim() ||
    null
  );
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
  const base = getOpenAiCompatibleBaseUrl() ?? "";
  const model = getOpenAiCompatibleModel();
  if (!base || !model) {
    throw new Error(
      "An OpenAI-compatible base URL and model are required. Set OPENAI_COMPATIBLE_* or LOCAL_LLM_* env vars."
    );
  }
  if (isVercelRuntime() && isLoopbackHost(base)) {
    throw new Error(
      "Your OpenAI-compatible base URL points to localhost, which is not reachable from Vercel. Use a public HTTPS endpoint such as Groq or another hosted model API."
    );
  }

  const url = `${base}/chat/completions`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  const apiKey = getOpenAiCompatibleApiKey();
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
    throw new Error(`OpenAI-compatible LLM ${res.status}: ${errText.slice(0, 300)}`);
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
  if (provider === "openai_compatible") {
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
  if (provider === "openai_compatible") {
    return openAiCompatibleChat(system, messages, maxTokens);
  }
  return anthropicMessages(system, messages, maxTokens);
}
