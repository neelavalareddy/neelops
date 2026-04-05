/**
 * Deterministic pre-checks that run before the LLM judge.
 * Fast and cheap — no API calls. Flags get stored in session_evaluations.precheck_flags.
 */

import type { AgentMessage } from "@/types/agents";

export type PrecheckFlag =
  | "TOO_FEW_TURNS"
  | "UNIFORM_MESSAGE_LENGTH"
  | "SUSPICIOUSLY_FAST"
  | "DUPLICATE_CONTENT";

export interface PrecheckResult {
  flags: PrecheckFlag[];
  passed: boolean;
}

const MIN_USER_TURNS = 3;
const MIN_LENGTH_STDEV = 8;

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function stdevMs(dates: string[]): number {
  if (dates.length < 2) return Infinity;
  const ts = dates.map((d) => new Date(d).getTime());
  const intervals: number[] = [];
  for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
  return stdev(intervals);
}

export function runPrechecks(userMessages: AgentMessage[]): PrecheckResult {
  const flags: PrecheckFlag[] = [];

  // 1. Minimum turn count
  if (userMessages.length < MIN_USER_TURNS) {
    flags.push("TOO_FEW_TURNS");
  }

  // 2. Message length variance (bots write uniform-length messages)
  if (userMessages.length >= 3) {
    const lengths = userMessages.map((m) => m.content.length);
    if (stdev(lengths) < MIN_LENGTH_STDEV) {
      flags.push("UNIFORM_MESSAGE_LENGTH");
    }
  }

  // 3. Response timing (bots respond instantly or at fixed intervals)
  if (userMessages.length >= 3) {
    const dates = userMessages.map((m) => m.created_at);
    const intervalStdev = stdevMs(dates);
    if (intervalStdev < 500) {
      // all responses within 500ms variance — robotic
      flags.push("SUSPICIOUSLY_FAST");
    }
  }

  // 4. Duplicate / near-duplicate content detection (across turns in this session)
  const seen = new Set<string>();
  for (const m of userMessages) {
    const normalized = m.content.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalized)) {
      flags.push("DUPLICATE_CONTENT");
      break;
    }
    seen.add(normalized);
  }

  // Prechecks that block payout
  const blocking: PrecheckFlag[] = ["TOO_FEW_TURNS", "DUPLICATE_CONTENT"];
  const passed = !flags.some((f) => blocking.includes(f));

  return { flags, passed };
}
