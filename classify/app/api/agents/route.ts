import { NextResponse } from "next/server";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Agent } from "@/types/agents";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Agent[] | null; error: unknown };

  if (error) return NextResponse.json({ error: "Failed to list agents." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const { company_name, name, objective, rules, persona, bounty_wld } = body as Record<string, unknown>;

    if (!String(company_name ?? "").trim() || !String(name ?? "").trim()) {
      return NextResponse.json({ error: "company_name and name are required." }, { status: 400 });
    }
    if (!String(objective ?? "").trim() || !String(rules ?? "").trim()) {
      return NextResponse.json({ error: "objective and rules are required." }, { status: 400 });
    }
    const bounty = Number(bounty_wld);
    if (!bounty || bounty <= 0) {
      return NextResponse.json({ error: "bounty_wld must be positive." }, { status: 400 });
    }

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("agents")
      .insert({
        company_name: String(company_name).trim(),
        name: String(name).trim(),
        objective: String(objective).trim(),
        rules: String(rules).trim(),
        persona: persona != null && String(persona).trim() ? String(persona).trim() : null,
        bounty_wld: bounty,
      })
      .select()
      .single() as { data: Agent | null; error: unknown };

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create agent." }, { status: 500 });
    }

    return NextResponse.json({ agent: data });
  } catch (e) {
    console.error("[agents POST]", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
