import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import MissingSupabaseConfig from "@/components/MissingSupabaseConfig";
import NavBar from "@/components/NavBar";
import AgentChat from "@/components/agents/AgentChat";
import type { Agent } from "@/types/agents";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <>
        <NavBar />
        <MissingSupabaseConfig />
      </>
    );
  }

  const supabase = createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single() as { data: Agent | null; error: unknown };

  if (!agent) notFound();

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-5 py-12 space-y-8">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          <Link href="/agents" className="hover:text-white transition-colors">Agents</Link>
          <span>/</span>
          <span>{agent.name}</span>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm" style={{ color: "var(--text-dim)" }}>{agent.company_name}</span>
            <span className="c-badge-gold">◈ {agent.bounty_wld} WLD bounty</span>
            {agent.status === "open" ? (
              <span className="c-badge-signal text-[10px] py-0.5"><span className="c-live-dot" /> Open</span>
            ) : (
              <span className="c-badge-muted text-[10px] py-0.5">Closed</span>
            )}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider leading-none mb-4">
            {agent.name}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="c-label mb-2">Objective</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-dim)" }}>{agent.objective}</p>
          </div>
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="c-label mb-2">Rules (Classify enforces)</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-dim)" }}>{agent.rules}</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-white tracking-wider mb-3">Session</h2>
          <AgentChat agent={agent} />
        </div>
      </main>
    </>
  );
}
