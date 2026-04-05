import Link from "next/link";
import { PUBLIC_AGENT_SELECT } from "@/lib/agents";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import MissingSupabaseConfig from "@/components/MissingSupabaseConfig";
import NavBar from "@/components/NavBar";
import SeedDemoAgentsButton from "@/components/agents/SeedDemoAgentsButton";
import type { Agent } from "@/types/agents";

export const revalidate = 0;

export default async function AgentsPage() {
  if (!hasSupabaseEnv()) {
    return (<><NavBar /><MissingSupabaseConfig /></>);
  }

  const supabase = createClient();
  const { data: agents } = (await supabase
    .from("agents")
    .select(PUBLIC_AGENT_SELECT)
    .order("created_at", { ascending: false })) as { data: Agent[] | null };

  const list = agents ?? [];
  const open = list.filter((a) => a.status === "open");
  const closed = list.filter((a) => a.status !== "open");

  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div className="agents-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--amber)", marginBottom: 8 }}>
              Agent Registry
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.0, marginBottom: 10 }}>
              Open Agents
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", maxWidth: 480 }}>
              Each agent has an objective and rules. Chat with it, try to achieve the goal — the Classify judge
              evaluates your prompting on four criteria before releasing the bounty.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <SeedDemoAgentsButton />
            <Link href="/agents/new" className="c-btn-primary" style={{ flexShrink: 0, padding: "9px 18px", fontSize: 12 }}>
              + Connect Agent
            </Link>
          </div>
        </div>

        {/* Open agents */}
        {open.length === 0 ? (
          <div style={{ border: "1px dashed var(--border-2)", borderRadius: 12, padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, color: "var(--text)", marginBottom: 8 }}>No open agents</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>Be the first to connect one.</p>
            <Link href="/agents/new" className="c-btn-primary" style={{ padding: "9px 20px", fontSize: 12 }}>Connect an agent →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {open.map((a, i) => {
              const avgPct = a.avg_score != null ? Math.round(Number(a.avg_score) * 100) : null;
              return (
                <Link
                  key={a.id}
                  href={`/agents/${a.id}`}
                  className="animate-fade-up"
                  style={{ textDecoration: "none", display: "block", animationDelay: `${i * 40}ms` }}
                >
                  <div className="c-case-card agents-card" style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em" }}>
                          CASE-{String(i + 1).padStart(3, "0")}
                        </span>
                        <span style={{ width: 1, height: 10, background: "var(--border-2)", display: "inline-block" }} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)" }}>{a.company_name}</span>
                        <div className="c-badge-pass" style={{ marginLeft: "auto" }}>
                          <span className="c-live-dot" style={{ width: 5, height: 5 }} />
                          Open
                        </div>
                      </div>
                      {/* Name */}
                      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6, lineHeight: 1.15 }}>
                        {a.name}
                      </div>
                      {/* Objective snippet */}
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 600 }}>
                        {a.objective}
                      </div>
                    </div>
                    {/* Right stats */}
                    <div className="agents-card-meta" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      <div className="c-badge-amber">◈ {a.bounty_wld} WLD</div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                          {a.tests_completed ?? 0} runs
                        </span>
                        {avgPct != null && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: avgPct >= 60 ? "var(--pass)" : "var(--fail)" }}>
                            avg {avgPct}/100
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)" }}>
                        Test →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <style>{`
          @media (max-width: 720px) {
            .agents-header {
              flex-direction: column;
              align-items: stretch;
              margin-bottom: 28px;
            }
            .agents-card {
              grid-template-columns: 1fr !important;
            }
            .agents-card-meta {
              align-items: flex-start !important;
            }
          }
        `}</style>

        {/* Closed agents */}
        {closed.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>
              Closed / Archived
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {closed.map((a, i) => (
                <Link key={a.id} href={`/agents/${a.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div className="c-case-card c-case-card-closed" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.55 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>CASE-{String(open.length + i + 1).padStart(3, "0")}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", fontStyle: "italic" }}>{a.name}</span>
                    </div>
                    <span className="c-badge-muted">Closed</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
