"use client";

import { useState } from "react";
import WorldIDButton from "@/components/WorldIDButton";
import StarRating from "@/components/StarRating";
import type { Task } from "@/types/database";

type Step = "verify" | "rate" | "submitting" | "done" | "error";

interface Props {
  task: Task;
}

export default function TaskFeedbackForm({ task }: Props) {
  const [step, setStep] = useState<Step>("verify");
  const [nullifierHash, setNullifierHash] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function onVerified(hash: string) {
    setNullifierHash(hash);
    setStep("rate");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;

    setStep("submitting");

    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: task.id,
        nullifier_hash: nullifierHash,
        rating,
        feedback_text: feedback.trim(),
      }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Submission failed." }));
      setErrorMsg(error ?? "Submission failed.");
      setStep("error");
      return;
    }

    setStep("done");
  }

  if (task.status === "closed") {
    return (
      <div className="glass-card p-6 text-center space-y-3">
        <p className="text-3xl">🔒</p>
        <p className="font-bold text-white">This task is closed</p>
        <p className="text-sm text-gray-500">No more submissions are being accepted.</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="glass-card p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F5C842]/10 border border-[#F5C842]/20 flex items-center justify-center text-3xl">
          ◈
        </div>
        <div>
          <p className="text-2xl font-black text-white mb-1">Payment Sent!</p>
          <p className="text-sm text-gray-400">
            <span className="text-[#F5C842] font-bold">{task.bounty_wld} WLD</span> has been sent to your
            World ID wallet.
          </p>
        </div>
        <div className="rounded-xl bg-[#F5C842]/5 border border-[#F5C842]/10 px-4 py-3 text-xs text-gray-500 font-mono break-all">
          nullifier: {nullifierHash.slice(0, 24)}…
        </div>
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            Your feedback has been recorded. Rating: {rating}/5
          </p>
          <div className="flex justify-center">
            <StarRating value={rating} readonly size="sm" />
          </div>
        </div>
        <a
          href="/tasks"
          className="btn-primary w-full justify-center"
        >
          Evaluate another task →
        </a>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="glass-card p-8 text-center space-y-5">
        <p className="text-3xl">❌</p>
        <p className="font-bold text-white">Submission failed</p>
        <p className="text-sm text-red-400">{errorMsg}</p>
        <button onClick={() => setStep("rate")} className="btn-ghost w-full justify-center">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Bounty */}
      <div className="flex items-center justify-between">
        <p className="font-bold text-white">Submit Evaluation</p>
        <span className="wld-badge text-base px-4 py-1.5">◈ {task.bounty_wld} WLD</span>
      </div>

      {/* Step 1: Verify */}
      <div className={`space-y-3 ${step !== "verify" ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            step !== "verify" ? "bg-[#22C55E] text-black" : "bg-[#7C6FFF] text-white"
          }`}>
            {step !== "verify" ? "✓" : "1"}
          </div>
          <p className="text-sm font-semibold text-white">Verify you&apos;re human</p>
        </div>

        {step === "verify" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Prove you&apos;re a unique human using World ID. Your identity stays private.
            </p>
            <WorldIDButton taskId={task.id} onVerified={onVerified} />
          </div>
        )}

        {step !== "verify" && (
          <div className="flex items-center gap-2 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/10 px-3 py-2 text-xs text-[#22C55E]">
            <span>✓</span> Verified — unique human confirmed
          </div>
        )}
      </div>

      <div className="h-px bg-white/[0.05]" />

      {/* Step 2: Rate & Submit */}
      <div className={`space-y-4 ${step === "verify" ? "opacity-40 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            step === "done" ? "bg-[#22C55E] text-black" : "bg-[#7C6FFF] text-white"
          }`}>
            {step === "done" ? "✓" : "2"}
          </div>
          <p className="text-sm font-semibold text-white">Rate &amp; submit</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="label">Your Rating</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {["", "Poor", "Below average", "Average", "Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="label">Feedback <span className="text-gray-700 normal-case tracking-normal font-normal">(required)</span></label>
            <textarea
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what you evaluated, any issues found, and specific suggestions..."
              className="input-dark resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={step !== "rate" || rating === 0 || !feedback.trim() || step === "submitting" as unknown as boolean}
            className="btn-primary w-full justify-center"
          >
            {step === "submitting" ? (
              <>
                <span className="animate-spin">⟳</span> Submitting…
              </>
            ) : (
              <>Submit &amp; Earn {task.bounty_wld} WLD</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
