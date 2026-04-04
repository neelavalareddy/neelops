import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import MissingSupabaseConfig from "@/components/MissingSupabaseConfig";
import NavBar from "@/components/NavBar";
import TasksBoard from "@/components/tasks/TasksBoard";
import type { Task, Response } from "@/types/database";

export const revalidate = 0;

export default async function TasksPage() {
  if (!hasSupabaseEnv()) {
    return (
      <>
        <NavBar />
        <MissingSupabaseConfig />
      </>
    );
  }

  const supabase = createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Task[] | null };

  const { data: responses } = await supabase
    .from("responses")
    .select("task_id, rating") as { data: Pick<Response, "task_id" | "rating">[] | null };

  const stats: Record<string, { count: number; avg: number | null }> = {};
  for (const r of responses ?? []) {
    if (!stats[r.task_id]) stats[r.task_id] = { count: 0, avg: null };
    stats[r.task_id].count++;
  }
  for (const taskId of Object.keys(stats)) {
    const taskResponses = (responses ?? []).filter((r) => r.task_id === taskId);
    stats[taskId].avg =
      taskResponses.length > 0
        ? taskResponses.reduce((s, r) => s + r.rating, 0) / taskResponses.length
        : null;
  }

  return (
    <>
      <NavBar />
      <TasksBoard tasks={tasks ?? []} stats={stats} />
    </>
  );
}
