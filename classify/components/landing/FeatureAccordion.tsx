"use client";

import { useState } from "react";

const FEATURES = [
  { label: "01", title: "Sybil-Resistant", body: "World ID nullifier hashes ensure each person submits once per task. No bots. No duplicates." },
  { label: "02", title: "Instant WLD", body: "Workers receive WLD the moment their evaluation is accepted. No invoices, no waiting." },
  { label: "03", title: "Structured Evals", body: "Star ratings plus free-form feedback. Companies get aggregated scores and raw insights." },
  { label: "04", title: "Zero Signup", body: "Verify your humanity once with World ID. No email. No password. No personal data stored." },
];

export default function FeatureAccordion() {
  const [open, setOpen] = useState<string | null>("01");

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="mb-12">
        <div className="c-pill mb-4">Why Classify</div>
        <h2 className="font-display text-white leading-none" style={{ fontSize: "clamp(2rem,5vw,3.75rem)", letterSpacing: "0.03em" }}>
          THE FEEDBACK LAYER<br />AI DESERVES.
        </h2>
        <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
          Tap a card to expand — compare details without leaving the page.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map((f) => {
          const isOpen = open === f.label;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setOpen(isOpen ? null : f.label)}
              className="text-left rounded-2xl border transition-all duration-200"
              style={{
                background: "var(--card)",
                borderColor: isOpen ? "rgba(0,255,135,0.22)" : "var(--border)",
                padding: isOpen ? "20px 20px 22px" : "20px",
                transform: isOpen ? "translateY(-2px)" : undefined,
                boxShadow: isOpen ? "0 0 0 1px rgba(0,255,135,0.08), 0 12px 36px rgba(0,0,0,0.35)" : undefined,
              }}
              aria-expanded={isOpen}
            >
              <div className="feat-num" style={{ marginBottom: 10 }}>
                {f.label}
              </div>
              <p className="text-sm font-semibold text-white mb-0 flex items-center justify-between gap-2">
                {f.title}
                <span
                  className="text-[10px] font-mono shrink-0 transition-transform duration-200"
                  style={{
                    color: "var(--signal)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  aria-hidden
                >
                  ▼
                </span>
              </p>
              {isOpen && (
                <p className="text-xs leading-relaxed pt-3 animate-fade-up" style={{ color: "var(--text-muted)" }}>
                  {f.body}
                </p>
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        .feat-num {
          font-family: var(--font-display);
          font-size: 2.25rem;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1px rgba(0,255,135,0.2);
        }
      `}</style>
    </section>
  );
}
