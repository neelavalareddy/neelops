import { NextResponse } from "next/server";
import { extractConsensusInsights } from "@/lib/ai/anthropic";
import { computeSuspiciousFlags } from "@/lib/ai/anomaly";
import { createServiceClient, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import type { Response, Task } from "@/types/database";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const { task_id, nullifier_hash, rating, feedback_text, time_to_submit_ms } = body as {
      task_id?: string;
      nullifier_hash?: string;
      rating?: number;
      feedback_text?: string;
      time_to_submit_ms?: number | null;
    };

    if (!task_id || !nullifier_hash) {
      return NextResponse.json({ error: "task_id and nullifier_hash are required." }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5." }, { status: 400 });
    }
    if (!feedback_text?.trim()) {
      return NextResponse.json({ error: "feedback_text is required." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const trimmedFeedback = feedback_text.trim();

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, bounty_wld")
      .eq("id", task_id)
      .single() as { data: { id: string; status: string; bounty_wld: number } | null; error: unknown };

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (task.status === "closed") {
      return NextResponse.json({ error: "This task is closed." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("responses")
      .select("id")
      .eq("task_id", task_id)
      .eq("nullifier_hash", nullifier_hash)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted feedback for this task." },
        { status: 409 }
      );
    }

    const flagged = await computeSuspiciousFlags(
      supabase,
      nullifier_hash,
      rating,
      time_to_submit_ms,
      trimmedFeedback.length
    );

    const timeMs =
      typeof time_to_submit_ms === "number" && time_to_submit_ms >= 0 && time_to_submit_ms < 3600_000
        ? Math.round(time_to_submit_ms)
        : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("responses")
      .insert({
        task_id,
        nullifier_hash,
        rating,
        feedback_text: trimmedFeedback,
        paid: true,
        flagged_suspicious: flagged,
        time_to_submit_ms: timeMs,
      })
      .select()
      .single() as { data: Response | null; error: unknown };

    if (error || !data) {
      return NextResponse.json({ error: "Failed to save response." }, { status: 500 });
    }

    await maybeGenerateInsights(supabase, task_id);

    return NextResponse.json({ id: data.id, bounty_wld: task.bounty_wld, flagged_suspicious: flagged });
  } catch (err) {
    console.error("[responses POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function maybeGenerateInsights(supabase: any, task_id: string) {
  try {
    const { data: t } = await supabase
      .from("tasks")
      .select("insights_json, ai_output, criteria")
      .eq("id", task_id)
      .single() as { data: Pick<Task, "ai_output" | "criteria"> & { insights_json: unknown } | null };

    if (!t || t.insights_json) return;

    const { count, error: cErr } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("task_id", task_id);

    if (cErr || (count ?? 0) < 5) return;

    const { data: rows } = await supabase
      .from("responses")
      .select("rating, feedback_text")
      .eq("task_id", task_id) as { data: Array<{ rating: number; feedback_text: string }> | null };

    if (!rows || rows.length < 5) return;

    const feedbacks = rows.map((r) => ({ rating: r.rating, text: r.feedback_text }));
    const insights = await extractConsensusInsights(t.ai_output, t.criteria, feedbacks);
    if (!insights) return;

    await supabase
      .from("tasks")
      .update({
        insights_json: insights,
        insights_generated_at: new Date().toISOString(),
      })
      .eq("id", task_id);
  } catch (e) {
    console.error("[maybeGenerateInsights]", e);
  }
}
