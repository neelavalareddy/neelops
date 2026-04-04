import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Response } from "@/types/database";

export async function POST(request: Request) {
  try {
    const { task_id, nullifier_hash, rating, feedback_text } = await request.json();

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

    // Check task exists and is open
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

    // Check nullifier uniqueness per task (one response per person per task)
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

    // Insert response (paid=true since payment is mocked)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("responses")
      .insert({
        task_id,
        nullifier_hash,
        rating,
        feedback_text: feedback_text.trim(),
        paid: true,
      })
      .select()
      .single() as { data: Response | null; error: unknown };

    if (error || !data) {
      return NextResponse.json({ error: "Failed to save response." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, bounty_wld: task.bounty_wld });
  } catch (err) {
    console.error("[responses POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
