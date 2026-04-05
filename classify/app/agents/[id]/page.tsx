import { notFound } from "next/navigation";
import Link from "next/link";
import { PUBLIC_AGENT_SELECT } from "@/lib/agents";
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
    return (<><NavBar /><MissingSupabaseConfig /></>);
  }

  const supabase = createClient();
  const { data: agent } = (await supabase
    .from("agents")
    .select(PUBLIC_AGENT_SELECT)
    .eq("id", id)
    .single()) as { data: Agent | null; error: unknown };

  if (!agent) notFound();

  const avgPct = agent.avg_score != null ? Math.round(Number(agent.avg_score) * 100) : null;

  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
          <Link href="/agents" style={{ color: "var(--text-3)", textDecoration: "none" }}>Agents</Link>
          <span>/</span>
          <span style={{ color: "var(--text-2)" }}>{agent.name}</span>
        </div>

        {/* Top — case header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)" }}>{agent.company_name}</span>
              <div className="c-badge-amber">◈ {agent.bounty_wld} WLD / session</div>
              {agent.status === "open"
                ? <div className="c-badge-pass"><span className="c-live-dot" style={{ width: 5, height: 5 }} />Open</div>
                : <div className="c-badge-muted">Closed</div>
              }
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.0, marginBottom: 14 }}>
              {agent.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                {agent.tests_completed ?? 0} completed test{(agent.tests_completed ?? 0) !== 1 ? "s" : ""}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                source: {agent.connection_mode === "openai_compatible" ? "external endpoint" : "built-in simulator"}
              </span>
              {avgPct != null && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: avgPct >= 60 ? "var(--pass)" : "var(--fail)" }}>
                  avg {avgPct}/100
                </span>
              )}
              <Link href={`/agents/${agent.id}/report`} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)", textDecoration: "none" }}>
                View evaluation report →
              </Link>
            </div>
          </div>
        </div>

        {/* Objective + Rules + Chat — 3-column on large screens */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid var(--blue)", borderRadius: "0 0 10px 10px", padding: "18px 20px" }}>
            <div className="c-label" style={{ color: "var(--blue)" }}>Objective</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.65, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{agent.objective}</p>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid var(--fail)", borderRadius: "0 0 10px 10px", padding: "18px 20px" }}>
            <div className="c-label" style={{ color: "var(--fail)" }}>Rules — Classify enforces these</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.65, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{agent.rules}</p>
          </div>
        </div>

        {/* Judge criteria reminder */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--amber-border)", borderRadius: 10, padding: "14px 20px", marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber)", marginBottom: 10 }}>
            How the judge scores your session
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Human authenticity", threshold: "≥ 70%", color: "var(--pass)" },
              { label: "Rule compliance", threshold: "≥ 80%", color: "var(--amber)" },
              { label: "Objective relevance", threshold: "≥ 60%", color: "var(--blue)" },
              { label: "Hallucinations logged", threshold: "All turns", color: "var(--fail)" },
            ].map((c) => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 28, background: c.color, borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>threshold: {c.threshold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>
            Live Session — min 3 turns required
          </div>
          <AgentChat agent={agent} />
        </div>
      </main>
    </>
  );
}
