export type TaskStatus = "open" | "closed";

export interface Task {
  id: string;
  company_name: string;
  ai_output: string;
  criteria: string;
  bounty_wld: number;
  status: TaskStatus;
  created_at: string;
}

export interface Response {
  id: string;
  task_id: string;
  nullifier_hash: string;
  rating: number;
  feedback_text: string;
  paid: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Task, "id" | "created_at">>;
        Relationships: [];
      };
      responses: {
        Row: Response;
        Insert: Omit<Response, "id" | "created_at" | "paid"> & { id?: string; paid?: boolean };
        Update: Partial<Omit<Response, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: Record<string, string[]>;
  };
}
