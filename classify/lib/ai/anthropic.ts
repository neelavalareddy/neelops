/**
 * Anthropic Messages API (fetch). Set ANTHROPIC_API_KEY in env.
 * Optional ANTHROPIC_MODEL (default: fast Haiku for cost/latency in dev).
 */

const API = "https://api.anthropic.com/v1/messages";

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function callClaude(system: string, user: string, maxTokens = 1024): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022";

  const res = await fetch(API, {
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
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  return text.trim();
}

/** Multi-turn chat (company “agent” roleplay). */
export async function callClaudeConversation(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens = 1024
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022";

  const res = await fetch(API, {
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
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  return text.trim();
}

export function parseJsonObject<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function predictTaskQuality(
  ai_output: string,
  criteria: string
): Promise<{ score: number; rationale: string } | null> {
  if (!isAnthropicConfigured()) return null;

  const system =
    "You predict how human evaluators will rate AI output on a 1–5 star scale before they see others' scores. " +
    "Reply with JSON only, no markdown: {\"score\": number 1-5, \"rationale\": string (max 2 sentences)}.";

  const user =
    `Evaluation criteria (what humans are told to use):\n${criteria.slice(0, 8000)}\n\n---\n\nAI output to score:\n${ai_output.slice(0, 12000)}`;

  try {
    const text = await callClaude(system, user, 256);
    const parsed = parseJsonObject<{ score?: number; rationale?: string }>(text);
    if (!parsed || typeof parsed.score !== "number") return null;
    const score = Math.round(parsed.score);
    if (score < 1 || score > 5) return null;
    return {
      score,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 500) : "",
    };
  } catch (e) {
    console.error("[predictTaskQuality]", e);
    return null;
  }
}

export type ConsensusInsights = {
  summary: string;
  themes: Array<{ label: string; rater_count: number; detail: string }>;
};

export async function extractConsensusInsights(
  ai_output: string,
  criteria: string,
  feedbacks: Array<{ rating: number; text: string }>
): Promise<ConsensusInsights | null> {
  if (!isAnthropicConfigured()) return null;
  if (feedbacks.length < 5) return null;

  const system =
    "You synthesize independent human ratings of AI output. " +
    "Reply with JSON only: {\"summary\": string (2-3 sentences), \"themes\": [{\"label\": string, \"rater_count\": number, \"detail\": string}]} " +
    "rater_count is how many of the provided reviews support that theme (estimate if implicit). Max 6 themes.";

  const lines = feedbacks
    .map((f, i) => `Rater ${i + 1} (${f.rating}/5): ${f.text.slice(0, 1200)}`)
    .join("\n\n");

  const user =
    `Criteria:\n${criteria.slice(0, 4000)}\n\n---\n\nAI output (abbrev):\n${ai_output.slice(0, 3000)}\n\n---\n\nReviews:\n${lines}`;

  try {
    const text = await callClaude(system, user, 1200);
    const parsed = parseJsonObject<{
      summary?: string;
      themes?: Array<{ label?: string; rater_count?: number; detail?: string }>;
    }>(text);
    if (!parsed || typeof parsed.summary !== "string") return null;
    const themes = Array.isArray(parsed.themes)
      ? parsed.themes
          .filter((t) => t && typeof t.label === "string")
          .map((t) => ({
            label: String(t.label).slice(0, 120),
            rater_count: typeof t.rater_count === "number" ? Math.min(99, Math.max(1, Math.round(t.rater_count))) : 1,
            detail: typeof t.detail === "string" ? t.detail.slice(0, 400) : "",
          }))
          .slice(0, 6)
      : [];
    return { summary: parsed.summary.slice(0, 1200), themes };
  } catch (e) {
    console.error("[extractConsensusInsights]", e);
    return null;
  }
}
