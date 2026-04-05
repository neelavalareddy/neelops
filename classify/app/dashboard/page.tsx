import Link from "next/link";
import NavBar from "@/components/NavBar";
import WorkerDashboard from "@/components/dashboard/WorkerDashboard";
import WorldWalletPanel from "@/components/WorldWalletPanel";
import { getRequestSessionUser } from "@/lib/auth/requestUser";

export default function DashboardPage() {
  const currentUser = getRequestSessionUser();

  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 88px", display: "flex", flexDirection: "column", gap: 24 }}>
        <section className="dashboard-hero-grid" style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)",
          gap: 20,
          alignItems: "stretch",
        }}>
          <div style={{
            background: "linear-gradient(180deg, var(--surface), var(--surface-2))",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: 24,
          }}>
            <div className="c-pill" style={{ marginBottom: 14 }}>Dashboard</div>
            <h1 style={{
              margin: "0 0 10px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
            }}>
              Your Classify control center
            </h1>
            <p style={{ margin: 0, maxWidth: 680, fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-2)", lineHeight: 1.7 }}>
              Use this page to jump into the live marketplace, publish a new agent, or review your worker history from the legacy task sandbox.
            </p>

            <div className="dashboard-triplet" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 18 }}>
              {[
                { label: "Companies", body: "Publish an agent and inspect evaluation reports." },
                { label: "Testers", body: "Browse live bounties and complete judged sessions." },
                { label: "Sandbox", body: "Legacy task-rating loop remains available here." },
              ].map((item) => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "linear-gradient(180deg, var(--surface), var(--surface-2))",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Quick actions
              </div>
              <Link href="/agents/new" className="c-btn-primary" style={{ justifyContent: "center", padding: "11px 14px" }}>
                Publish an agent
              </Link>
              <Link href="/agents" className="c-btn-ghost" style={{ justifyContent: "center", padding: "11px 14px" }}>
                Browse live agents
              </Link>
              <Link href="/tasks" className="c-btn-ghost" style={{ justifyContent: "center", padding: "11px 14px" }}>
                Open task sandbox
              </Link>
              <Link href="/post" className="c-btn-ghost" style={{ justifyContent: "center", padding: "11px 14px" }}>
                Post a legacy task
              </Link>
            </div>

            <WorldWalletPanel />
          </div>
        </section>

        <section style={{
          background: "linear-gradient(180deg, rgba(18,26,43,0.7), rgba(18,26,43,0.45))",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 20,
        }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Worker activity
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
              This section reflects the current task-based worker history flow. It still works and remains available while the marketplace-facing agent flow expands.
            </div>
          </div>
          <WorkerDashboard
            initialNullifierHash={currentUser?.role === "worker" ? currentUser.world_id_nullifier_hash : null}
          />
        </section>
        <style>{`
          @media (max-width: 900px) {
            .dashboard-hero-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 720px) {
            .dashboard-triplet {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
