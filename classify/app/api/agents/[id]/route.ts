import { NextResponse } from "next/server";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Agent } from "@/types/agents";

interface Ctx {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Ctx) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const { id } = params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single() as { data: Agent | null; error: unknown };

  if (error || !data) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  return NextResponse.json({ agent: data });
}
