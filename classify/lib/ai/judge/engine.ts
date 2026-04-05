/**
 * Judge Engine — orchestrates prechecks → single LLM judge.
 * Produces session scoring, pass/fail, and hallucination flags.
 */

import {
  callLlmSingleTurn,
  isLlmConfigured,
  getAiProvider,
  getOpenAiCompatibleModel,
} from "@/lib/ai/llm";
import { parseJsonObject } from "@/lib/ai/anthropic";
import { runPrechecks } from "./prechecks";
import {
  JUDGE_SYSTEM,
  buildJudgePrompt,
  buildTranscript,
  type JudgeOutput,
  type HallucinationFlag,
} from "./prompts";
import type { Agent, AgentMessage } from "@/types/agents";

export interface SessionJudgeResult {
  relevance_score: number;
  relevance_reason: string;
  rule_compliance_score: number;
  rule_compliance_reason: string;
  ai_detection_score: number;
  ai_detection_reason: string;
  objective_completion: number;
  objective_completion_reason: string;
  conversation_depth_score: number;
  conversation_depth_reason: string;
  edge_case_coverage_score: number;
  edge_case_coverage_reason: string;
  problem_discovery_score: number;
  problem_discovery_reason: string;
  hallucination_flags: HallucinationFlag[];
  overall_score: number;
  overall_assessment: string;
  passed: boolean;
  judge_model: string;
  judge_reasoning: string;
  secondary_judge_model: string | null;
  secondary_judge_agreed: boolean | null;
  precheck_flags: string[];
}

const PASSING = {
  relevance: 0.5,
  rule_compliance: 0.75,
  ai_detection: 0.65,
  problem_discovery: 0.25,
} as const;

function clamp(n: unknown, lo = 0, hi = 1): number {
  const v = typeof n === "number" ? n : parseFloat(String(n));
  if (isNaN(v)) return (lo + hi) / 2;
  return Math.min(hi, Math.max(lo, v));
}

function computeOverall(j: JudgeOutput): number {
  return (
    j.problem_discovery_score * 0.28 +
    j.edge_case_coverage_score * 0.20 +
    j.conversation_depth_score * 0.17 +
    j.relevance_score * 0.13 +
    j.objective_completion * 0.10 +
    j.ai_detection_score * 0.07 +
    j.rule_compliance_score * 0.05
  );
}

function doesPass(j: JudgeOutput): boolean {
  return (
    j.relevance_score >= PASSING.relevance &&
    j.rule_compliance_score >= PASSING.rule_compliance &&
    j.ai_detection_score >= PASSING.ai_detection &&
    j.problem_discovery_score >= PASSING.problem_discovery
  );
}

function normalizeJudgeOutput(parsed: Partial<JudgeOutput>): JudgeOutput {
  const flags: HallucinationFlag[] = Array.isArray(parsed.hallucination_flags)
    ? parsed.hallucination_flags
        .filter((f) => f && typeof f.claim === "string")
        .map((f) => ({
          turn: typeof f.turn === "number" ? f.turn : 0,
          claim: String(f.claim).slice(0, 500),
          severity: (["low", "medium", "high", "critical"].includes(f.severity as string)
            ? f.severity
            : "low") as HallucinationFlag["severity"],
        }))
        .slice(0, 20)
    : [];

  return {
    relevance_score: clamp(parsed.relevance_score),
    relevance_reason: String(parsed.relevance_reason ?? "").slice(0, 400),
    rule_compliance_score: clamp(parsed.rule_compliance_score),
    rule_compliance_reason: String(parsed.rule_compliance_reason ?? "").slice(0, 400),
    ai_detection_score: clamp(parsed.ai_detection_score),
    ai_detection_reason: String(parsed.ai_detection_reason ?? "").slice(0, 400),
    objective_completion: clamp(parsed.objective_completion),
    objective_completion_reason: String(parsed.objective_completion_reason ?? "").slice(0, 400),
    conversation_depth_score: clamp(parsed.conversation_depth_score),
    conversation_depth_reason: String(parsed.conversation_depth_reason ?? "").slice(0, 400),
    edge_case_coverage_score: clamp(parsed.edge_case_coverage_score),
    edge_case_coverage_reason: String(parsed.edge_case_coverage_reason ?? "").slice(0, 400),
    problem_discovery_score: clamp(parsed.problem_discovery_score),
    problem_discovery_reason: String(parsed.problem_discovery_reason ?? "").slice(0, 400),
    hallucination_flags: flags,
    overall_assessment: String(parsed.overall_assessment ?? "").slice(0, 1000),
    pass: Boolean(parsed.pass),
  };
}

function applyConversationDepthGuard(
  depthScore: number,
  userMessages: AgentMessage[]
): number {
  const turns = userMessages.length;
  const maxAllowed =
    turns <= 2 ? 0.35 :
    turns === 3 ? 0.6 :
    turns === 4 ? 0.75 :
    turns === 5 ? 0.88 :
    1;

  return Math.min(depthScore, maxAllowed);
}

function severityWeight(flags: HallucinationFlag[]): number {
  return flags.reduce((sum, flag) => {
    if (flag.severity === "critical") return sum + 1;
    if (flag.severity === "high") return sum + 0.7;
    if (flag.severity === "medium") return sum + 0.4;
    return sum + 0.2;
  }, 0);
}

export function computeSessionReward(baseBounty: number, result: Pick<
  SessionJudgeResult,
  "passed" | "overall_score" | "problem_discovery_score" | "edge_case_coverage_score" | "conversation_depth_score" | "hallucination_flags"
>): number {
  if (!result.passed) return 0;

  const flagBonus = Math.min(0.25, severityWeight(result.hallucination_flags) * 0.05);
  const multiplier = Math.min(
    1.75,
    0.55 +
      result.overall_score * 0.6 +
      result.problem_discovery_score * 0.25 +
      result.edge_case_coverage_score * 0.2 +
      result.conversation_depth_score * 0.15 +
      flagBonus
  );

  return Math.round(baseBounty * multiplier * 10000) / 10000;
}

async function callJudge(prompt: string): Promise<JudgeOutput | null> {
  try {
    const raw = await callLlmSingleTurn(JUDGE_SYSTEM, prompt, 1200);
    const parsed = parseJsonObject<Partial<JudgeOutput>>(raw);
    if (!parsed || typeof parsed.relevance_score !== "number") return null;
    return normalizeJudgeOutput(parsed);
  } catch (e) {
    console.error("[callJudge]", e);
    return null;
  }
}

export async function judgeSession(
  agent: Pick<Agent, "name" | "objective" | "rules">,
  allMessages: AgentMessage[],
  userMessages: AgentMessage[]
): Promise<SessionJudgeResult> {
  const { flags: precheckFlags, passed: precheckPassed } = runPrechecks(userMessages);

  if (!precheckPassed) {
    return {
      relevance_score: 0,
      relevance_reason: "Failed pre-checks before LLM evaluation.",
      rule_compliance_score: 0,
      rule_compliance_reason: "Failed pre-checks before LLM evaluation.",
      ai_detection_score: 0,
      ai_detection_reason: "Failed pre-checks before LLM evaluation.",
      objective_completion: 0,
      objective_completion_reason: "Failed pre-checks before LLM evaluation.",
      conversation_depth_score: 0,
      conversation_depth_reason: "Failed pre-checks before LLM evaluation.",
      edge_case_coverage_score: 0,
      edge_case_coverage_reason: "Failed pre-checks before LLM evaluation.",
      problem_discovery_score: 0,
      problem_discovery_reason: "Failed pre-checks before LLM evaluation.",
      hallucination_flags: [],
      overall_score: 0,
      overall_assessment: `Failed pre-checks: ${precheckFlags.join(", ")}`,
      passed: false,
      judge_model: "prechecks",
      judge_reasoning: `Precheck failures: ${precheckFlags.join(", ")}`,
      secondary_judge_model: null,
      secondary_judge_agreed: null,
      precheck_flags: precheckFlags,
    };
  }

  const transcript = buildTranscript(allMessages);
  const prompt = buildJudgePrompt({
    agentName: agent.name,
    agentObjective: agent.objective,
    agentRules: agent.rules,
    transcript,
  });

  const primaryModel =
    getAiProvider() === "openai_compatible"
      ? (getOpenAiCompatibleModel() ?? "openai-compatible")
      : (process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022");

  if (!isLlmConfigured()) {
    return {
      relevance_score: 0.7,
      relevance_reason: "Demo mode — LLM judge offline.",
      rule_compliance_score: 0.9,
      rule_compliance_reason: "Demo mode.",
      ai_detection_score: 0.8,
      ai_detection_reason: "Demo mode.",
      objective_completion: 0.7,
      objective_completion_reason: "Demo mode.",
      conversation_depth_score: 0.65,
      conversation_depth_reason: "Demo mode.",
      edge_case_coverage_score: 0.55,
      edge_case_coverage_reason: "Demo mode.",
      problem_discovery_score: 0.5,
      problem_discovery_reason: "Demo mode.",
      hallucination_flags: [],
      overall_score: 0.726,
      overall_assessment: "Demo mode — configure Anthropic, Groq, or another OpenAI-compatible model endpoint for live judging.",
      passed: true,
      judge_model: "demo",
      judge_reasoning: "Demo mode.",
      secondary_judge_model: null,
      secondary_judge_agreed: null,
      precheck_flags: precheckFlags,
    };
  }

  const primary = await callJudge(prompt);

  if (!primary) {
    return {
      relevance_score: 0,
      relevance_reason: "Primary judge failed to return valid JSON.",
      rule_compliance_score: 0,
      rule_compliance_reason: "Judge error.",
      ai_detection_score: 0,
      ai_detection_reason: "Judge error.",
      objective_completion: 0,
      objective_completion_reason: "Judge error.",
      conversation_depth_score: 0,
      conversation_depth_reason: "Judge error.",
      edge_case_coverage_score: 0,
      edge_case_coverage_reason: "Judge error.",
      problem_discovery_score: 0,
      problem_discovery_reason: "Judge error.",
      hallucination_flags: [],
      overall_score: 0,
      overall_assessment: "Judge encountered an error. Session marked as failed for safety.",
      passed: false,
      judge_model: primaryModel,
      judge_reasoning: "Parse error.",
      secondary_judge_model: null,
      secondary_judge_agreed: null,
      precheck_flags: precheckFlags,
    };
  }

  const finalResult = {
    ...primary,
    conversation_depth_score: applyConversationDepthGuard(primary.conversation_depth_score, userMessages),
  };
  const finalPassed = doesPass(finalResult);

  const overall = computeOverall(finalResult);

  return {
    relevance_score: Math.round(finalResult.relevance_score * 1000) / 1000,
    relevance_reason: finalResult.relevance_reason,
    rule_compliance_score: Math.round(finalResult.rule_compliance_score * 1000) / 1000,
    rule_compliance_reason: finalResult.rule_compliance_reason,
    ai_detection_score: Math.round(finalResult.ai_detection_score * 1000) / 1000,
    ai_detection_reason: finalResult.ai_detection_reason,
    objective_completion: Math.round(finalResult.objective_completion * 1000) / 1000,
    objective_completion_reason: finalResult.objective_completion_reason,
    conversation_depth_score: Math.round(finalResult.conversation_depth_score * 1000) / 1000,
    conversation_depth_reason: finalResult.conversation_depth_reason,
    edge_case_coverage_score: Math.round(finalResult.edge_case_coverage_score * 1000) / 1000,
    edge_case_coverage_reason: finalResult.edge_case_coverage_reason,
    problem_discovery_score: Math.round(finalResult.problem_discovery_score * 1000) / 1000,
    problem_discovery_reason: finalResult.problem_discovery_reason,
    hallucination_flags: finalResult.hallucination_flags,
    overall_score: Math.round(overall * 1000) / 1000,
    overall_assessment: finalResult.overall_assessment,
    passed: finalPassed,
    judge_model: primaryModel,
    judge_reasoning: finalResult.overall_assessment,
    secondary_judge_model: null,
    secondary_judge_agreed: null,
    precheck_flags: precheckFlags,
  };
}
