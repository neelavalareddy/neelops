/**
 * Judge prompt templates — verbatim from README spec with minor formatting.
 */

export interface JudgeInput {
  agentName: string;
  agentObjective: string;
  agentRules: string;
  transcript: string;
}

export interface HallucinationFlag {
  turn: number;
  claim: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface JudgeOutput {
  relevance_score: number;
  relevance_reason: string;
  rule_compliance_score: number;
  rule_compliance_reason: string;
  ai_detection_score: number;
  ai_detection_reason: string;
  objective_completion: number;
  objective_completion_reason: string;
  hallucination_flags: HallucinationFlag[];
  overall_assessment: string;
  pass: boolean;
}

export const JUDGE_SYSTEM =
  "You are an evaluation judge for an AI agent testing platform. " +
  "Respond ONLY with the requested JSON — no markdown fences, no commentary.";

export function buildJudgePrompt(input: JudgeInput): string {
  return `You are an evaluation judge for an AI agent testing platform.

CONTEXT:
- Agent Name: ${input.agentName}
- Agent Objective: ${input.agentObjective.slice(0, 4000)}
- Rules: ${input.agentRules.slice(0, 2000)}
- Conversation transcript below.

EVALUATE the tester's interaction on these criteria. For each, provide a score from 0.0 to 1.0 and a one-sentence justification.

1. RELEVANCE (0.0-1.0): Did the tester's messages genuinely attempt to complete or test the stated objective? Score 0 for off-topic spam, 1.0 for focused, purposeful interaction.

2. RULE COMPLIANCE (0.0-1.0): Did the tester follow all listed rules? Score 0 if rules were violated, 1.0 if fully compliant.

3. HUMAN AUTHENTICITY (0.0-1.0): Do the tester's messages appear to be written by a real human? Look for: natural typos, varied sentence structure, contextual responses, personality. Score 0 for obvious bot/template messages, 1.0 for clearly human.

4. OBJECTIVE COMPLETION (0.0-1.0): Did the conversation make a genuine attempt at the objective? Note: the agent may have failed the objective (that's valuable data!) — score based on whether the TESTER tried, not whether the AGENT succeeded.

5. HALLUCINATION FLAGS: List any instances where the AGENT made claims that appear fabricated, unsupported, or contradictory. For each flag, cite the turn number, the specific claim, and severity (low/medium/high/critical).

RESPOND IN THIS EXACT JSON FORMAT:
{
  "relevance_score": 0.0,
  "relevance_reason": "",
  "rule_compliance_score": 0.0,
  "rule_compliance_reason": "",
  "ai_detection_score": 0.0,
  "ai_detection_reason": "",
  "objective_completion": 0.0,
  "objective_completion_reason": "",
  "hallucination_flags": [
    {"turn": 0, "claim": "", "severity": "low|medium|high|critical"}
  ],
  "overall_assessment": "",
  "pass": true
}

PASSING CRITERIA: All of relevance >= 0.6, rule_compliance >= 0.8, ai_detection >= 0.7, objective_completion >= 0.5.

CONVERSATION TRANSCRIPT:
${input.transcript.slice(0, 16000)}`;
}

/** Build a readable transcript from messages. */
export function buildTranscript(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map((m, i) => `[Turn ${i + 1}] ${m.role === "user" ? "Tester" : "Agent"}: ${m.content}`)
    .join("\n\n");
}
