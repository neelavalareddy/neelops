export type AgentStatus = "open" | "closed";
export type AgentConnectionMode = "simulated" | "openai_compatible";

export interface Agent {
  id: string;
  company_name: string;
  name: string;
  objective: string;
  rules: string;
  persona: string | null;
  bounty_wld: number;
  connection_mode: AgentConnectionMode;
  endpoint_base_url: string | null;
  endpoint_model: string | null;
  status: AgentStatus;
  // Added in migration 004
  tests_completed: number;
  avg_score: number | null;
  created_at: string;
}

export interface AgentConnectionSecret {
  agent_id: string;
  endpoint_api_key: string;
  created_at: string;
}

export type AgentSessionStatus = "active" | "eligible" | "rejected" | "closed";

export interface AgentSession {
  id: string;
  agent_id: string;
  nullifier_hash: string;
  status: AgentSessionStatus;
  payout_note: string | null;
  created_at: string;
}

export type AgentMessageRole = "user" | "assistant";

export interface AgentMessage {
  id: string;
  session_id: string;
  role: AgentMessageRole;
  content: string;
  created_at: string;
}

export interface AgentMessageEvaluation {
  message_id: string;
  relevance_1_5: number;
  ai_likelihood_0_1: number;
  rules_compliant: boolean;
  rationale: string | null;
  created_at: string;
}

export type AgentMessageWithEval = AgentMessage & {
  evaluation?: AgentMessageEvaluation | null;
};

export type HallucinationSeverity = "low" | "medium" | "high" | "critical";

export interface HallucinationFlag {
  turn: number;
  claim: string;
  severity: HallucinationSeverity;
}

/** Full session-level judge evaluation — stored in session_evaluations table (migration 004). */
export interface SessionEvaluation {
  id: string;
  session_id: string;

  relevance_score: number;
  relevance_reason: string | null;
  rule_compliance_score: number;
  rule_compliance_reason: string | null;
  ai_detection_score: number;
  ai_detection_reason: string | null;
  objective_completion: number;
  objective_completion_reason: string | null;

  hallucination_flags: HallucinationFlag[];

  overall_score: number;
  overall_assessment: string | null;
  passed: boolean;

  judge_model: string;
  judge_reasoning: string | null;
  secondary_judge_model: string | null;
  secondary_judge_agreed: boolean | null;

  precheck_flags: string[];

  created_at: string;
}
