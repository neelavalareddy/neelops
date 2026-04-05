import { NextResponse } from "next/server";
import { resolveRequestWorkerNullifier } from "@/lib/auth/requestUser";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Response, Task, WorkerSummaryRow } from "@/types/database";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const { nullifier_hash } = await request.json();
    const identity = resolveRequestWorkerNullifier(
      typeof nullifier_hash === "string" ? nullifier_hash : null
    );
    if (!identity.nullifierHash) {
      return NextResponse.json(
        { error: identity.error ?? "Worker identity is required." },
        { status: identity.status ?? 400 }
      );
    }

    const supabase = createClient();

    const { data: responses, error: rErr } = await supabase
      .from("responses")
      .select("*")
      .eq("nullifier_hash", identity.nullifierHash)
      .order("created_at", { ascending: false }) as { data: Response[] | null; error: unknown };

    if (rErr) {
      return NextResponse.json({ error: "Failed to load your activity." }, { status: 500 });
    }

    const list = responses ?? [];
    if (list.length === 0) {
      return NextResponse.json({ rows: [], total_wld: 0 });
    }

    const taskIds = Array.from(new Set(list.map((r) => r.task_id)));
    const { data: tasks, error: tErr } = await supabase
      .from("tasks")
      .select("*")
      .in("id", taskIds) as { data: Task[] | null; error: unknown };

    if (tErr || !tasks) {
      return NextResponse.json({ error: "Failed to load task details." }, { status: 500 });
    }

    const taskById = Object.fromEntries(tasks.map((t) => [t.id, t]));
    const rows: WorkerSummaryRow[] = list
      .map((r) => {
        const task = taskById[r.task_id];
        if (!task) return null;
        return { ...r, task };
      })
      .filter((x): x is WorkerSummaryRow => x != null);

    const total_wld = rows.reduce((s, r) => s + (r.paid ? Number(r.task.bounty_wld) : 0), 0);

    return NextResponse.json({ rows, total_wld });
  } catch (err) {
    console.error("[worker/summary]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
