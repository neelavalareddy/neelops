export type AgentStatus = "open" | "closed";

export interface Agent {
  id: string;
  company_name: string;
  name: string;
  objective: string;
  rules: string;
  persona: string | null;
  bounty_wld: number;
  status: AgentStatus;
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
