"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import WorldIDButton from "@/components/WorldIDButton";

interface Props {
  nextPath: string;
}

export default function LoginPageClient({ nextPath }: Props) {
  const router = useRouter();
  const [godSecret, setGodSecret] = useState("");
  const [godLoading, setGodLoading] = useState(false);
  const [godError, setGodError] = useState<string | null>(null);

  function handleWorldIdVerified() {
    router.replace(nextPath);
    router.refresh();
  }

  async function handleGodModeLogin(e: React.FormEvent) {
    e.preventDefault();
    setGodLoading(true);
    setGodError(null);

    try {
      const res = await fetch("/api/auth/god-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret: godSecret }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGodError(typeof json?.error === "string" ? json.error : "God mode login failed.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setGodError("God mode login failed.");
    } finally {
      setGodLoading(false);
    }
  }

  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 88px" }}>
        <section
          className="login-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, var(--surface), var(--surface-2))",
              border: "1px solid var(--border)",
              borderRadius: 22,
              padding: 28,
            }}
          >
            <div className="c-pill" style={{ marginBottom: 14 }}>Login required</div>
            <h1
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
              }}
            >
              Sign in before using Classify
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 720,
                fontFamily: "var(--font-body)",
                fontSize: 15,
                color: "var(--text-2)",
                lineHeight: 1.7,
              }}
            >
              The app now requires authentication before browsing agents, opening tasks, submitting feedback,
              or using API routes. World ID is the standard login path for everyone, and you have a god mode
              unlock below for administrative access.
            </p>

            <div
              className="login-triplet"
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                { label: "Protected pages", body: "Agents, tasks, dashboard, and posting flows all require a session." },
                { label: "Protected APIs", body: "App API routes reject unauthenticated requests by default." },
                { label: "Bypass", body: "God mode issues an admin session using your private env-backed secret." },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--amber)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--text-2)",
                      lineHeight: 1.55,
                    }}
                  >
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section
              style={{
                background: "linear-gradient(180deg, var(--surface), var(--surface-2))",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 22,
              }}
            >
              <div className="c-label" style={{ marginBottom: 10 }}>World ID</div>
              <p
                style={{
                  margin: "0 0 16px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                }}
              >
                Standard user path. Successful verification creates or reuses an account, then starts a signed session.
              </p>
              <WorldIDButton taskId="login" onVerified={handleWorldIdVerified} />
            </section>

            <section
              style={{
                background: "linear-gradient(180deg, rgba(255,214,10,0.08), rgba(255,214,10,0.03))",
                border: "1px solid var(--amber-border)",
                borderRadius: 20,
                padding: 22,
              }}
            >
              <div className="c-label" style={{ color: "var(--amber)", marginBottom: 10 }}>God Mode</div>
              <p
                style={{
                  margin: "0 0 16px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                }}
              >
                Private admin bypass for you. This path is disabled unless `GOD_MODE_SECRET` is configured on the server.
              </p>

              <form onSubmit={handleGodModeLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="password"
                  className="c-input"
                  placeholder="Enter god mode secret"
                  value={godSecret}
                  onChange={(e) => setGodSecret(e.target.value)}
                />
                <button
                  type="submit"
                  className="c-btn-primary"
                  style={{ justifyContent: "center", padding: "11px 14px" }}
                  disabled={godLoading || !godSecret.trim()}
                >
                  {godLoading ? "Unlocking…" : "Unlock god mode"}
                </button>
                {godError ? (
                  <div
                    style={{
                      background: "var(--fail-dim)",
                      border: "1px solid var(--fail-border)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--fail)",
                    }}
                  >
                    {godError}
                  </div>
                ) : null}
              </form>
            </section>
          </div>
        </section>
        <style>{`
          @media (max-width: 900px) {
            .login-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 720px) {
            .login-triplet {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
