import Link from "next/link";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import MissingSupabaseConfig from "@/components/MissingSupabaseConfig";
import NavBar from "@/components/NavBar";
import type { Agent } from "@/types/agents";

export const revalidate = 0;

export default async function AgentsPage() {
  if (!hasSupabaseEnv()) {
    return (
      <>
        <NavBar />
        <MissingSupabaseConfig />
      </>
    );
  }

  const supabase = createClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Agent[] | null };

  const list = agents ?? [];
  const open = list.filter((a) => a.status === "open");

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="c-pill mb-3">Pre-production testing</div>
            <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-2">
              AGENTS
            </h1>
            <p className="text-sm max-w-xl" style={{ color: "var(--text-muted)" }}>
              Companies list agents with an objective. You chat with them; Classify’s model checks each of your messages
              for relevance, rule violations, and AI-generated cheating. Pass the gate to earn the posted WLD bounty
              and help catch hallucinations before ship.
            </p>
          </div>
          <Link href="/agents/new" className="c-btn-primary shrink-0 py-2.5 text-xs">
            List an agent
          </Link>
        </div>

        {open.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="font-display text-2xl text-white mb-2">NO OPEN AGENTS</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>List one to start testing conversations.</p>
            <Link href="/agents/new" className="c-btn-primary py-2 text-xs">List an agent →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {open.map((a) => (
              <Link
                key={a.id}
                href={`/agents/${a.id}`}
                className="rounded-2xl border p-5 block transition-all hover:border-[rgba(0,255,135,0.2)]"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>{a.company_name}</span>
                  <span className="c-badge-gold text-[10px] py-0.5">◈ {a.bounty_wld} WLD</span>
                </div>
                <p className="font-display text-xl text-white tracking-wide mb-2">{a.name}</p>
                <p className="text-xs line-clamp-3" style={{ color: "var(--text-muted)" }}>{a.objective}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
