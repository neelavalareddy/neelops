import Link from "next/link";

const FEATURES = [
  {
    icon: "🌐",
    title: "World ID Verified",
    body: "Every feedback provider is a unique, verified human. No bots, no duplicates, no sybil attacks.",
  },
  {
    icon: "⚡",
    title: "Instant WLD Payments",
    body: "Workers get paid in WLD the moment their evaluation is accepted. No invoices, no waiting.",
  },
  {
    icon: "📊",
    title: "Structured Evaluations",
    body: "Star ratings plus free-form feedback. Companies get aggregated scores and raw insights.",
  },
  {
    icon: "🔒",
    title: "Sybil Resistant",
    body: "Nullifier hashes ensure each World ID can only submit once per task — quality guaranteed.",
  },
];

const HOW_IT_WORKS_COMPANY = [
  { n: "01", title: "Post a Task", body: "Paste your AI output, write evaluation criteria, and set a WLD bounty." },
  { n: "02", title: "Workers Evaluate", body: "Verified humans review your AI output and submit structured feedback." },
  { n: "03", title: "Review Results", body: "See aggregated ratings, average scores, and raw feedback in your dashboard." },
];

const HOW_IT_WORKS_WORKER = [
  { n: "01", title: "Verify with World ID", body: "One tap to prove you're human. No signup, no forms." },
  { n: "02", title: "Pick a Task", body: "Browse open tasks. Choose ones that match your expertise." },
  { n: "03", title: "Rate & Earn", body: "Submit your honest evaluation and receive WLD instantly." },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] bg-[#7C6FFF]/12 -top-40 -left-40" />
      <div className="orb w-[500px] h-[500px] bg-[#F5C842]/8 top-60 -right-40" />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C6FFF] text-sm font-black text-white">
            C
          </span>
          <span className="font-bold text-lg text-white tracking-tight">Classify</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks" className="btn-ghost py-2 text-xs">
            Browse Tasks
          </Link>
          <Link href="/post" className="btn-primary py-2 text-xs">
            Post a Task →
          </Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="section-pill mb-6">
          Powered by World ID · WLD Payments
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-6 max-w-5xl">
          Human feedback,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C6FFF] to-[#B8AEFF]">
            provably real.
          </span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-10">
          Companies post AI evaluation tasks. Verified humans complete them.
          Everyone gets paid in WLD.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/post"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7C6FFF] px-8 py-4 text-base font-bold text-white hover:bg-[#6A5FE8] transition-all hover:scale-105 active:scale-100 shadow-lg shadow-[#7C6FFF]/20"
          >
            Post a Task
            <span className="text-[#B8AEFF]">→</span>
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/5 transition-all"
          >
            <span className="text-[#22C55E]">●</span>
            Start Earning WLD
          </Link>
        </div>

        {/* Trust bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className="text-[#22C55E]">✓</span> Sybil-resistant
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-2">
            <span className="text-[#22C55E]">✓</span> World ID verified
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-2">
            <span className="text-[#F5C842]">✓</span> WLD bounties
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-2">
            <span className="text-[#22C55E]">✓</span> No signup required
          </span>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="section-pill mb-4">Why Classify</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            The feedback layer AI deserves
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card p-6 space-y-3">
              <div className="text-3xl">{f.icon}</div>
              <p className="font-bold text-white">{f.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Company */}
          <div className="glass-card p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#7C6FFF]/10 border border-[#7C6FFF]/20 px-3 py-1 text-xs font-semibold text-[#7C6FFF] uppercase tracking-widest mb-6">
              🏢 For Companies
            </div>
            <h3 className="text-2xl font-black text-white mb-6">Get real human evals</h3>
            <div className="space-y-6">
              {HOW_IT_WORKS_COMPANY.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <span className="text-5xl font-black text-transparent shrink-0" style={{ WebkitTextStroke: "1px rgba(124,111,255,0.3)" }}>
                    {step.n}
                  </span>
                  <div className="pt-2">
                    <p className="font-bold text-white">{step.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/post" className="btn-primary mt-8 w-full justify-center">
              Post your first task →
            </Link>
          </div>

          {/* Worker */}
          <div className="glass-card border-[#F5C842]/15 p-8" style={{ background: "rgba(245,200,66,0.02)" }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F5C842]/10 border border-[#F5C842]/20 px-3 py-1 text-xs font-semibold text-[#F5C842] uppercase tracking-widest mb-6">
              💰 For Workers
            </div>
            <h3 className="text-2xl font-black text-white mb-6">Earn WLD for your time</h3>
            <div className="space-y-6">
              {HOW_IT_WORKS_WORKER.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <span className="text-5xl font-black text-transparent shrink-0" style={{ WebkitTextStroke: "1px rgba(245,200,66,0.3)" }}>
                    {step.n}
                  </span>
                  <div className="pt-2">
                    <p className="font-bold text-white">{step.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tasks" className="mt-8 w-full justify-center inline-flex items-center gap-2 rounded-xl border border-[#F5C842]/20 bg-[#F5C842]/10 px-5 py-2.5 text-sm font-semibold text-[#F5C842] hover:bg-[#F5C842]/15 transition-colors">
              Browse open tasks →
            </Link>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-4 text-center max-w-3xl mx-auto">
        <div className="orb w-96 h-96 bg-[#7C6FFF]/10 inset-0 mx-auto my-auto" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7C6FFF] to-[#4A45B5] flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-[#7C6FFF]/30">
            C
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-4">
            Ready to classify?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            The only feedback marketplace where every rater is provably human.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/post" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7C6FFF] px-8 py-4 text-base font-bold text-white hover:bg-[#6A5FE8] transition-all shadow-lg shadow-[#7C6FFF]/20">
              Post a Task →
            </Link>
            <Link href="/tasks" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/5 transition-all">
              Start Earning
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7C6FFF]/20 text-[#7C6FFF] text-xs font-black">C</span>
            <span className="font-semibold text-gray-400">Classify</span>
          </div>
          <p>Verified human feedback · Powered by World ID &amp; WLD</p>
          <p>© {new Date().getFullYear()} Classify</p>
        </div>
      </footer>
    </div>
  );
}
