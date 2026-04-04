import Link from "next/link";
import { DINING_HALLS } from "@/lib/constants/buildings";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white overflow-x-hidden">
      <style>{`
        /* Grain overlay */
        .grain::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        /* Gold shimmer text */
        .gold-text {
          background: linear-gradient(135deg, #CFB991 0%, #EBD99F 40%, #8E6F3E 60%, #CFB991 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Step number outline style */
        .step-num {
          font-family: 'Bebas Neue', 'Impact', sans-serif;
          font-size: 7rem;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1px rgba(207, 185, 145, 0.25);
          user-select: none;
        }

        /* Diagonal clip for section transitions */
        .clip-diagonal {
          clip-path: polygon(0 0, 100% 3%, 100% 100%, 0 97%);
        }

        /* Gold rule */
        .gold-rule {
          height: 2px;
          background: linear-gradient(90deg, transparent, #CFB991, transparent);
        }

        /* Hover lift on cards */
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(207, 185, 145, 0.12);
        }

        /* Ticker tape */
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker 22s linear infinite;
          display: flex; width: max-content;
        }

        /* Fade-up animation */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.25s; }
        .fade-up-3 { animation-delay: 0.4s; }
        .fade-up-4 { animation-delay: 0.55s; }

        /* Dotted grid bg */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(207,185,145,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      {/* ─── GRAIN OVERLAY ─────────────────────────────────────────────── */}
      <div className="grain" aria-hidden="true" />

      {/* ─── NAV ───────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display text-2xl tracking-wider gold-text">
          BOILERBASKET
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-body text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="font-body text-sm font-semibold bg-[#CFB991] text-black px-5 py-2 rounded-full hover:bg-[#EBD99F] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center text-center px-6 dot-grid">
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(142,111,62,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Eyebrow */}
          <div className="fade-up fade-up-1 inline-flex items-center gap-2 border border-[#CFB991]/30 rounded-full px-4 py-1.5 mb-8 font-body text-xs font-medium tracking-widest text-[#CFB991] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CFB991] animate-pulse inline-block" />
            Purdue University · West Lafayette
          </div>

          {/* Main headline */}
          <h1
            className="font-display gold-text leading-none tracking-wide mb-6 fade-up fade-up-2"
            style={{ fontSize: "clamp(4rem, 13vw, 11rem)" }}
          >
            SKIP THE WALK.
            <br />
            <span className="text-white" style={{ WebkitTextFillColor: "white" }}>
              GET YOUR MEAL.
            </span>
          </h1>

          {/* Sub */}
          <p className="font-body text-lg md:text-xl text-gray-300 max-w-xl mx-auto leading-relaxed mb-10 fade-up fade-up-3">
            Fellow Boilermakers pick up your dining-hall order using their meal
            swipe and bring it to you — for a small convenience fee.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center fade-up fade-up-4">
            <Link
              href="/signup"
              className="font-body font-semibold text-base bg-[#CFB991] text-black px-8 py-4 rounded-2xl hover:bg-[#EBD99F] transition-all hover:scale-105 active:scale-100 shadow-lg shadow-[#CFB991]/20"
            >
              Sign up with @purdue.edu →
            </Link>
            <Link
              href="/login"
              className="font-body font-medium text-base border border-white/20 text-white px-8 py-4 rounded-2xl hover:bg-white/8 transition-colors"
            >
              I already have an account
            </Link>
          </div>

          {/* Scroll cue */}
          <div className="mt-20 flex flex-col items-center gap-2 text-gray-600 fade-up fade-up-4">
            <span className="font-body text-xs tracking-widest uppercase">How it works</span>
            <div className="w-px h-10 bg-gradient-to-b from-gray-600 to-transparent" />
          </div>
        </div>
      </section>

      {/* ─── TICKER TRUST BAR ──────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-[#CFB991]/20 bg-[#CFB991]/5 py-3 overflow-hidden">
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              {[
                "🎓  Purdue students only",
                "🔒  Secure payments via Stripe",
                "⭐  Ratings & reviews",
                "🍽️  6 dining courts",
                "💸  Apple Pay · Venmo · PayPal · Card",
                "🚶  Fee based on walk distance",
                "⚡  Real-time order tracking",
                "🏛️  Boilermaker community",
              ].map((item) => (
                <span
                  key={item}
                  className="font-body text-sm font-medium text-[#CFB991]/80 whitespace-nowrap px-10"
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-body text-xs font-semibold tracking-widest text-[#CFB991] uppercase mb-3">
            The flow
          </p>
          <h2 className="font-display text-5xl md:text-7xl tracking-wide text-white">
            HOW IT WORKS
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          {/* Requester column */}
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-8 lg:p-10">
            <div className="inline-block bg-[#CFB991]/10 border border-[#CFB991]/30 rounded-full px-4 py-1.5 mb-8">
              <span className="font-body text-xs font-semibold tracking-widest text-[#CFB991] uppercase">
                🍔  Hungry? Request
              </span>
            </div>
            <div className="space-y-8">
              {[
                {
                  n: "01",
                  title: "Post your order",
                  body: "Pick a dining court, describe what you want, set your drop-off building. Takes 30 seconds.",
                },
                {
                  n: "02",
                  title: "A picker claims it",
                  body: "A fellow Boilermaker heading to that dining hall sees your order and grabs it with their meal swipe.",
                },
                {
                  n: "03",
                  title: "Food, delivered",
                  body: "Track status in real time. Pay securely — meal cost + small convenience fee. Rate your picker.",
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-5 items-start">
                  <span className="step-num shrink-0">{step.n}</span>
                  <div className="pt-3">
                    <p className="font-display text-2xl tracking-wide text-white mb-1">{step.title}</p>
                    <p className="font-body text-sm text-gray-400 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Picker column */}
          <div className="rounded-3xl border border-[#CFB991]/20 bg-[#CFB991]/[0.04] p-8 lg:p-10">
            <div className="inline-block bg-[#CFB991]/15 border border-[#CFB991]/40 rounded-full px-4 py-1.5 mb-8">
              <span className="font-body text-xs font-semibold tracking-widest text-[#CFB991] uppercase">
                💰  Earn? Pick up
              </span>
            </div>
            <div className="space-y-8">
              {[
                {
                  n: "01",
                  title: "Browse open orders",
                  body: "On your way to a dining court? Check the feed. Filter by location and pick up an order near you.",
                },
                {
                  n: "02",
                  title: "Swipe & grab the food",
                  body: "Use your own meal swipe to pay. The system already knows the estimated cost — no out-of-pocket surprise.",
                },
                {
                  n: "03",
                  title: "Deliver & get paid",
                  body: "Drop it off, mark delivered. Your earnings are released via Stripe Connect straight to your account.",
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-5 items-start">
                  <span className="step-num shrink-0" style={{ WebkitTextStroke: "1px rgba(207,185,145,0.45)" }}>{step.n}</span>
                  <div className="pt-3">
                    <p className="font-display text-2xl tracking-wide text-white mb-1">{step.title}</p>
                    <p className="font-body text-sm text-gray-400 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fee callout */}
        <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-sm text-gray-400 text-center sm:text-left">
            <span className="text-white font-semibold">Convenience fee:</span>{" "}
            $1.20 base + $0.10 per walk-minute from dining hall → your building.
            <br className="hidden sm:block" />
            Most orders are under $3 extra.
          </p>
          <div className="shrink-0 font-display text-3xl gold-text tracking-wide whitespace-nowrap">
            ~ $1–3 fee
          </div>
        </div>
      </section>

      {/* ─── GOLD RULE ─────────────────────────────────────────────────── */}
      <div className="gold-rule mx-6 max-w-6xl md:mx-auto" />

      {/* ─── DINING HALLS ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-body text-xs font-semibold tracking-widest text-[#CFB991] uppercase mb-3">
            All covered
          </p>
          <h2 className="font-display text-5xl md:text-7xl tracking-wide text-white mb-4">
            DINING COURTS
          </h2>
          <p className="font-body text-gray-400 text-base max-w-md mx-auto">
            Every on-campus dining court is supported. More locations added as the network grows.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {DINING_HALLS.map((hall) => (
            <div
              key={hall.id}
              className="hover-lift rounded-2xl border border-white/8 bg-white/[0.03] p-6 flex flex-col gap-3 group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-[#CFB991]/10 border border-[#CFB991]/20 flex items-center justify-center text-xl group-hover:bg-[#CFB991]/20 transition-colors">
                🍽️
              </div>
              <div>
                <p className="font-display text-xl tracking-wide text-white leading-tight">
                  {hall.name.replace(" Dining Court", "").replace(" (Mark Hall)", "").replace("1Bowl", "1Bowl")}
                </p>
                <p className="font-body text-xs text-gray-500 mt-0.5">
                  {hall.name.includes("Dining Court") ? "Dining Court" : "Dining Hall"}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="font-body text-xs text-gray-500">Active</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PAYMENT METHODS ───────────────────────────────────────────── */}
      <section className="relative z-10 clip-diagonal bg-[#2D2D2D] py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-body text-xs font-semibold tracking-widest text-[#CFB991] uppercase mb-3">
            Pay any way you want
          </p>
          <h2 className="font-display text-5xl md:text-6xl tracking-wide text-white mb-10">
            CHECKOUT IN SECONDS
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { emoji: "💳", label: "Credit & Debit Card" },
              { emoji: "🍎", label: "Apple Pay" },
              { emoji: "📱", label: "Google Pay" },
              { emoji: "🅿️", label: "PayPal" },
              { emoji: "💜", label: "Venmo" },
            ].map((method) => (
              <div
                key={method.label}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-4"
              >
                <span className="text-2xl">{method.emoji}</span>
                <span className="font-body font-medium text-white text-sm">{method.label}</span>
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-gray-500 mt-8">
            Powered by Stripe · Payments held in escrow and released on delivery
          </p>
        </div>
      </section>

      {/* ─── BOTTOM CTA ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6 text-center max-w-3xl mx-auto">
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(142,111,62,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#CFB991] to-[#8E6F3E] flex items-center justify-center shadow-2xl shadow-[#CFB991]/30">
            <span className="font-display text-3xl text-black tracking-wide">BB</span>
          </div>
          <h2
            className="font-display gold-text tracking-wide leading-none mb-6"
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}
          >
            READY TO EAT?
          </h2>
          <p className="font-body text-gray-400 text-lg mb-10">
            Sign up with your Purdue email. Verified students only.
          </p>
          <Link
            href="/signup"
            className="inline-block font-body font-semibold text-lg bg-[#CFB991] text-black px-10 py-5 rounded-2xl hover:bg-[#EBD99F] transition-all hover:scale-105 active:scale-100 shadow-2xl shadow-[#CFB991]/25"
          >
            Get started — it&apos;s free to join
          </Link>
          <p className="font-body text-gray-600 text-sm mt-5">
            You only pay when you place an order.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/8 bg-[#141414]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl tracking-wider gold-text">BOILERBASKET</span>
          <p className="font-body text-xs text-gray-600 text-center">
            A peer-to-peer campus food service for Purdue University students only.
            <br />Not affiliated with Purdue University Dining or Purdue University.
          </p>
          <p className="font-body text-xs text-gray-600">
            © {new Date().getFullYear()} BoilerBasket
          </p>
        </div>
      </footer>
    </div>
  );
}
