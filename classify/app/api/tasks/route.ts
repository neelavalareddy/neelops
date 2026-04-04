import { NextResponse } from "next/server";
import { predictTaskQuality } from "@/lib/ai/anthropic";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Task } from "@/types/database";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Task[] | null; error: unknown };

  if (error) return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const { company_name, ai_output, criteria, bounty_wld } = await request.json();

    if (!company_name?.trim() || !ai_output?.trim() || !criteria?.trim()) {
      return NextResponse.json({ error: "company_name, ai_output, and criteria are required." }, { status: 400 });
    }
    if (!bounty_wld || bounty_wld <= 0) {
      return NextResponse.json({ error: "bounty_wld must be a positive number." }, { status: 400 });
    }

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("tasks")
      .insert({ company_name: company_name.trim(), ai_output: ai_output.trim(), criteria: criteria.trim(), bounty_wld })
      .select()
      .single() as { data: Task | null; error: unknown };

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
    }

    let taskOut = data as Task;
    const prediction = await predictTaskQuality(data.ai_output, data.criteria);
    if (prediction) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uErr } = await (supabase as any)
        .from("tasks")
        .update({
          predicted_score: prediction.score,
          prediction_rationale: prediction.rationale,
        })
        .eq("id", data.id);
      if (!uErr) {
        taskOut = {
          ...taskOut,
          predicted_score: prediction.score,
          prediction_rationale: prediction.rationale,
        };
      }
    }

    return NextResponse.json({ id: taskOut.id, task: taskOut });
  } catch (err) {
    console.error("[tasks POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
