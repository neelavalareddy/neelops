"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

const BOUNTY_PRESETS = [0.25, 0.5, 1.0, 2.0];

export default function PostTaskPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [criteria, setCriteria] = useState("");
  const [bounty, setBounty] = useState("0.50");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const bountyNum = parseFloat(bounty);
    if (isNaN(bountyNum) || bountyNum <= 0) {
      setError("Please enter a valid WLD bounty amount.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: companyName.trim(),
        ai_output: aiOutput.trim(),
        criteria: criteria.trim(),
        bounty_wld: bountyNum,
      }),
    });

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: "Failed to post task." }));
      setError(msg ?? "Failed to post task.");
      setLoading(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/dashboard?highlight=${id}`);
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="section-pill mb-3">For Companies</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Post an Evaluation Task</h1>
          <p className="text-gray-500 text-sm">
            Verified humans will rate your AI output and provide structured feedback. You set the bounty.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Company name */}
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="label">Company / Team Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. OpenEval AI"
                className="input-dark"
              />
            </div>
          </div>

          {/* AI output */}
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="label">AI Output to Evaluate</label>
              <p className="text-xs text-gray-600 mb-3">
                Paste the exact text, code, or content you want humans to review.
              </p>
              <textarea
                required
                rows={8}
                value={aiOutput}
                onChange={(e) => setAiOutput(e.target.value)}
                placeholder="Paste your AI-generated content here..."
                className="input-dark resize-y font-mono text-xs"
              />
            </div>
          </div>

          {/* Evaluation criteria */}
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="label">Evaluation Criteria</label>
              <p className="text-xs text-gray-600 mb-3">
                Tell workers exactly what to look for. The more specific, the better the feedback.
              </p>
              <textarea
                required
                rows={4}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="e.g. Rate this output for: (1) Factual accuracy, (2) Completeness, (3) Clarity..."
                className="input-dark resize-y"
              />
            </div>
          </div>

          {/* Bounty */}
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="label">WLD Bounty per Response</label>
              <p className="text-xs text-gray-600 mb-3">
                Each verified human who completes this task earns this amount.
              </p>
              <div className="flex gap-2 mb-3">
                {BOUNTY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBounty(preset.toFixed(2))}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                      parseFloat(bounty) === preset
                        ? "border-[#F5C842]/40 bg-[#F5C842]/10 text-[#F5C842]"
                        : "border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {preset} WLD
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  className="input-dark w-40"
                />
                <span className="text-sm font-semibold text-[#F5C842]">WLD</span>
              </div>
            </div>

            {/* Cost preview */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 text-sm">
              <div className="flex justify-between text-gray-500 mb-1">
                <span>Per response</span>
                <span className="text-[#F5C842]">{parseFloat(bounty) || 0} WLD</span>
              </div>
              <div className="flex justify-between text-gray-500 mb-1">
                <span>Example — 10 responses</span>
                <span className="text-[#F5C842]">{((parseFloat(bounty) || 0) * 10).toFixed(2)} WLD</span>
              </div>
              <p className="text-xs text-gray-700 mt-2">
                ✱ WLD transfers are mocked in this demo. Real payments require World Chain integration.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center py-3 text-base"
            >
              {loading ? "Posting…" : "Post Task →"}
            </button>
            <Link href="/dashboard" className="btn-ghost py-3">
              View Dashboard
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
