import Link from "next/link";

const FEATURES = [
  { label: "01", title: "Sybil-Resistant", body: "World ID nullifier hashes ensure each person submits once per task. No bots. No duplicates." },
  { label: "02", title: "Instant WLD", body: "Workers receive WLD the moment their evaluation is accepted. No invoices, no waiting." },
  { label: "03", title: "Structured Evals", body: "Star ratings plus free-form feedback. Companies get aggregated scores and raw insights." },
  { label: "04", title: "Zero Signup", body: "Verify your humanity once with World ID. No email. No password. No personal data stored." },
];

const COMPANY_STEPS = [
  { n: "01", title: "Post a Task", body: "Paste your AI output, write evaluation criteria, set a WLD bounty per response." },
  { n: "02", title: "Workers Evaluate", body: "Verified humans review your content and submit structured 1–5 star feedback." },
  { n: "03", title: "Review Results", body: "See aggregated scores, average ratings, and every raw response in your dashboard." },
];

const WORKER_STEPS = [
  { n: "01", title: "Verify Identity", body: "One World ID proof. Prove you're human. Your identity stays private." },
  { n: "02", title: "Pick a Task", body: "Browse the open task board. Each shows the bounty, criteria, and response count." },
  { n: "03", title: "Rate & Earn", body: "Submit honest feedback. WLD lands in your wallet immediately." },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">

      {/* NAV */}
      <header className="landing-nav">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-mark">
              <span className="font-display text-lg leading-none" style={{ color: "var(--signal)" }}>C</span>
            </div>
            <span className="font-display text-xl tracking-wider text-white">CLASSIFY</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/tasks" className="lnav-link text-sm">Browse Tasks</Link>
            <Link href="/post" className="c-btn-primary py-2 text-xs">Post a Task</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-glow-l" aria-hidden />
        <div className="hero-glow-r" aria-hidden />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-[1fr_400px] gap-12 items-center">
          <div>
            <div className="c-pill mb-6 animate-fade-up">Powered by World ID · WLD Payments</div>

            <h1 className="hero-hed animate-fade-up animate-delay-100">
              HUMAN<br />
              FEEDBACK,<br />
              <span className="hero-hed-outline">PROVABLY<br />REAL.</span>
            </h1>

            <p className="hero-sub animate-fade-up animate-delay-200">
              Companies post AI evaluation tasks.<br />
              Verified humans complete them.<br />
              Everyone gets paid in WLD.
            </p>

            <div className="flex flex-wrap gap-3 mt-8 animate-fade-up animate-delay-300">
              <Link href="/post" className="c-btn-primary px-7 py-3.5 text-sm">Post a Task →</Link>
              <Link href="/tasks" className="c-btn-ghost px-7 py-3.5 text-sm">
                <span className="c-live-dot" style={{ marginRight: 6 }} />
                Start Earning WLD
              </Link>
            </div>

            <div className="trust-bar animate-fade-up animate-delay-400">
              {["Sybil-resistant", "World ID verified", "WLD bounties", "No signup"].map((item, i) => (
                <span key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {i > 0 && <span style={{ width: 1, height: 12, background: "var(--border-strong)", display: "inline-block" }} />}
                  <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
                    <polyline points="1,4.5 3.5,7 8,1.5" stroke="var(--signal)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Iris orb */}
          <div className="hero-orb-wrap animate-fade-in animate-delay-200" aria-hidden>
            <div className="iris-container" style={{ width: 340, height: 340, maxWidth: "100%" }}>
              <div className="iris-ring iris-ring-1" />
              <div className="iris-ring iris-ring-2" />
              <div className="iris-ring iris-ring-3" />
              <div className="iris-ring iris-ring-4" />
              <div className="iris-core" />
              <span style={{ position: "absolute", top: "12%", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.25em", color: "var(--signal)", opacity: 0.4, textTransform: "uppercase" }}>VERIFIED</span>
              <span style={{ position: "absolute", bottom: "12%", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.25em", color: "var(--signal)", opacity: 0.4, textTransform: "uppercase" }}>HUMAN</span>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap" aria-hidden>
        <div className="ticker-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="ticker-seg">
              WORLD ID VERIFIED <span style={{ color: "var(--signal)", margin: "0 16px" }}>◈</span>
              HUMAN FEEDBACK <span style={{ color: "var(--signal)", margin: "0 16px" }}>◈</span>
              WLD PAYMENTS <span style={{ color: "var(--signal)", margin: "0 16px" }}>◈</span>
              SYBIL RESISTANT <span style={{ color: "var(--signal)", margin: "0 16px" }}>◈</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="c-pill mb-4">Why Classify</div>
          <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2rem,5vw,3.75rem)", letterSpacing: "0.03em" }}>
            THE FEEDBACK LAYER<br />AI DESERVES.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.label} className="feat-card">
              <div className="feat-num">{f.label}</div>
              <p className="text-sm font-semibold text-white mb-1.5">{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Company */}
          <div className="how-card">
            <div className="how-tag" style={{ color: "var(--signal)", borderColor: "var(--signal-border)", background: "var(--signal-dim)" }}>FOR COMPANIES</div>
            <h3 className="font-display text-3xl text-white tracking-wider mb-8">GET REAL HUMAN EVALS</h3>
            <div className="space-y-6">
              {COMPANY_STEPS.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <span className="font-display text-5xl leading-none" style={{ color: "transparent", WebkitTextStroke: "1px rgba(0,255,135,0.2)", flexShrink: 0, width: 52 }}>{s.n}</span>
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-white mb-0.5">{s.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/post" className="c-btn-primary mt-8 w-full justify-center py-3">Post your first task →</Link>
          </div>

          {/* Worker */}
          <div className="how-card" style={{ background: "rgba(240,180,41,0.015)" }}>
            <div className="how-tag" style={{ color: "var(--gold)", borderColor: "var(--gold-border)", background: "var(--gold-dim)" }}>FOR WORKERS</div>
            <h3 className="font-display text-3xl text-white tracking-wider mb-8">EARN WLD FOR YOUR TIME</h3>
            <div className="space-y-6">
              {WORKER_STEPS.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <span className="font-display text-5xl leading-none" style={{ color: "transparent", WebkitTextStroke: "1px rgba(240,180,41,0.22)", flexShrink: 0, width: 52 }}>{s.n}</span>
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-white mb-0.5">{s.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tasks" className="c-btn-gold mt-8 w-full justify-center py-3">Browse open tasks →</Link>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,255,135,0.045) 0%, transparent 65%)", pointerEvents: "none" }} aria-hidden />
        <div className="relative z-10 text-center max-w-2xl mx-auto px-6 py-32">
          <div className="iris-container mx-auto mb-8" style={{ width: 80, height: 80 }} aria-hidden>
            <div className="iris-ring iris-ring-1" />
            <div className="iris-ring iris-ring-2" />
            <div className="iris-ring iris-ring-3" />
            <div className="iris-core" />
          </div>
          <h2 className="font-display text-white leading-tight mb-4" style={{ fontSize: "clamp(3rem,8vw,5.5rem)", letterSpacing: "0.03em" }}>
            READY TO<br />CLASSIFY?
          </h2>
          <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
            The only feedback marketplace where every rater is provably human.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/post" className="c-btn-primary px-8 py-3.5 text-sm justify-center">Post a Task →</Link>
            <Link href="/tasks" className="c-btn-ghost px-8 py-3.5 text-sm justify-center">Start Earning</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 0" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="logo-mark" style={{ width: 24, height: 24, borderRadius: 6 }}>
              <span className="font-display text-sm leading-none" style={{ color: "var(--signal)" }}>C</span>
            </div>
            <span className="font-display tracking-wider text-sm text-white">CLASSIFY</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Verified human feedback · Powered by World ID &amp; WLD</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} Classify</p>
        </div>
      </footer>

      <style>{`
        .landing-nav {
          position: sticky; top: 0; z-index: 50;
          border-bottom: 1px solid var(--border);
          background: rgba(5,5,7,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .logo-mark {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--signal-dim); border: 1px solid var(--signal-border);
          flex-shrink: 0;
        }
        .lnav-link {
          border-radius: 8px; padding: 6px 12px;
          color: var(--text-dim); transition: color 0.15s, background 0.15s;
        }
        .lnav-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }

        .hero-section { position: relative; overflow: hidden; }
        .hero-glow-l {
          position: absolute; top: -100px; left: -200px;
          width: 600px; height: 600px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(0,255,135,0.07) 0%, transparent 70%);
        }
        .hero-glow-r {
          position: absolute; top: 10%; right: -200px;
          width: 500px; height: 500px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(240,180,41,0.05) 0%, transparent 70%);
        }
        .hero-hed {
          font-family: var(--font-display);
          font-size: clamp(3.5rem, 8vw, 7rem);
          line-height: 0.95; letter-spacing: 0.02em;
          color: white; margin-bottom: 1.5rem;
        }
        .hero-hed-outline {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(0, 255, 135, 0.65);
        }
        .hero-sub {
          font-size: 0.9375rem; line-height: 1.8;
          color: var(--text-dim);
        }
        .trust-bar {
          display: flex; flex-wrap: wrap; align-items: center;
          gap: 4px; margin-top: 2rem;
        }
        .hero-orb-wrap {
          display: flex; align-items: center; justify-content: center;
        }

        .ticker-wrap {
          overflow: hidden;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.008);
          padding: 11px 0;
        }
        .ticker-track {
          display: flex; white-space: nowrap;
          animation: ticker 44s linear infinite;
        }
        .ticker-seg {
          padding: 0 40px;
          font-family: var(--font-mono);
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--text-muted);
        }

        .feat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feat-card:hover { border-color: rgba(0,255,135,0.14); transform: translateY(-2px); }
        .feat-num {
          font-family: var(--font-display);
          font-size: 2.25rem; line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1px rgba(0,255,135,0.2);
          margin-bottom: 10px;
        }

        .how-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 32px;
        }
        .how-tag {
          display: inline-block;
          font-family: var(--font-mono); font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 100px;
          border-width: 1px; border-style: solid;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
