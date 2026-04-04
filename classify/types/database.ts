import type {
  Agent,
  AgentMessage,
  AgentMessageEvaluation,
  AgentSession,
} from "@/types/agents";

export type TaskStatus = "open" | "closed";

/** LLM consensus block stored on tasks.insights_json */
export type TaskInsightsJson = {
  summary: string;
  themes: Array<{ label: string; rater_count: number; detail: string }>;
};

export interface Task {
  id: string;
  company_name: string;
  ai_output: string;
  criteria: string;
  bounty_wld: number;
  status: TaskStatus;
  created_at: string;
  /** Set after insert when Anthropic is configured (migration 002). */
  predicted_score?: number | null;
  prediction_rationale?: string | null;
  insights_json?: TaskInsightsJson | null;
  insights_generated_at?: string | null;
}

export interface Response {
  id: string;
  task_id: string;
  nullifier_hash: string;
  rating: number;
  feedback_text: string;
  paid: boolean;
  created_at: string;
  flagged_suspicious?: boolean;
  time_to_submit_ms?: number | null;
}

/** One of your evaluations with the task joined (worker dashboard). */
export type WorkerSummaryRow = Response & { task: Task };

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<
          Task,
          | "id"
          | "created_at"
          | "predicted_score"
          | "prediction_rationale"
          | "insights_json"
          | "insights_generated_at"
        > & {
          id?: string;
          predicted_score?: number | null;
          prediction_rationale?: string | null;
          insights_json?: TaskInsightsJson | null;
          insights_generated_at?: string | null;
        };
        Update: Partial<Omit<Task, "id" | "created_at">>;
        Relationships: [];
      };
      responses: {
        Row: Response;
        Insert: Omit<Response, "id" | "created_at" | "paid" | "flagged_suspicious" | "time_to_submit_ms"> & {
          id?: string;
          paid?: boolean;
          flagged_suspicious?: boolean;
          time_to_submit_ms?: number | null;
        };
        Update: Partial<Omit<Response, "id" | "created_at">>;
        Relationships: [];
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Agent, "id" | "created_at">>;
        Relationships: [];
      };
      agent_sessions: {
        Row: AgentSession;
        Insert: Omit<AgentSession, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<AgentSession, "id" | "created_at">>;
        Relationships: [];
      };
      agent_messages: {
        Row: AgentMessage;
        Insert: Omit<AgentMessage, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<AgentMessage, "id" | "created_at">>;
        Relationships: [];
      };
      agent_message_evaluations: {
        Row: AgentMessageEvaluation;
        Insert: Omit<AgentMessageEvaluation, "created_at">;
        Update: Partial<Omit<AgentMessageEvaluation, "message_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: Record<string, string[]>;
  };
}
