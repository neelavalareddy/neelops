import { NextResponse } from "next/server";
import { PUBLIC_AGENT_SELECT } from "@/lib/agents";
import { createClient, createServiceClient, hasSupabaseEnv, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import type { Agent } from "@/types/agents";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select(PUBLIC_AGENT_SELECT)
    .order("created_at", { ascending: false }) as { data: Agent[] | null; error: unknown };

  if (error) return NextResponse.json({ error: "Failed to list agents." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const {
      company_name,
      name,
      objective,
      rules,
      persona,
      bounty_wld,
      connection_mode,
      endpoint_base_url,
      endpoint_api_key,
      endpoint_model,
    } = body as Record<string, unknown>;

    if (!String(company_name ?? "").trim() || !String(name ?? "").trim()) {
      return NextResponse.json({ error: "company_name and name are required." }, { status: 400 });
    }
    if (!String(objective ?? "").trim() || !String(rules ?? "").trim()) {
      return NextResponse.json({ error: "objective and rules are required." }, { status: 400 });
    }
    const connectionMode =
      connection_mode === "openai_compatible" ? "openai_compatible" : "simulated";
    const endpointBaseUrl =
      endpoint_base_url != null && String(endpoint_base_url).trim()
        ? String(endpoint_base_url).trim().replace(/\/$/, "")
        : null;
    const endpointApiKey =
      endpoint_api_key != null && String(endpoint_api_key).trim()
        ? String(endpoint_api_key).trim()
        : null;
    const endpointModel =
      endpoint_model != null && String(endpoint_model).trim()
        ? String(endpoint_model).trim()
        : null;

    if (connectionMode === "openai_compatible" && (!endpointBaseUrl || !endpointModel)) {
      return NextResponse.json(
        { error: "endpoint_base_url and endpoint_model are required for external connections." },
        { status: 400 }
      );
    }

    const bounty = Number(bounty_wld);
    if (!bounty || bounty <= 0) {
      return NextResponse.json({ error: "bounty_wld must be positive." }, { status: 400 });
    }

    const supabase = createServiceClient();
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
        connection_mode: connectionMode,
        endpoint_base_url: endpointBaseUrl,
        endpoint_model: endpointModel,
      })
      .select()
      .single() as { data: Agent | null; error: unknown };

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create agent." }, { status: 500 });
    }

    if (connectionMode === "openai_compatible" && endpointApiKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: secretError } = await (supabase as any)
        .from("agent_connection_secrets")
        .upsert({
          agent_id: data.id,
          endpoint_api_key: endpointApiKey,
        });

      if (secretError) {
        return NextResponse.json({ error: "Failed to save endpoint secret." }, { status: 500 });
      }
    }

    return NextResponse.json({ agent: data });
  } catch (e) {
    console.error("[agents POST]", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
