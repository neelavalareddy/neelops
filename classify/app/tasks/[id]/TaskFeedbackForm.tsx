"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WorldIDButton from "@/components/WorldIDButton";
import StarRating from "@/components/StarRating";
import { persistWorkerNullifier } from "@/lib/workerIdentity";
import type { Task } from "@/types/database";

type Step = "verify" | "rate" | "submitting" | "done" | "error";

interface Props {
  task: Task;
}

const RATING_LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

export default function TaskFeedbackForm({ task }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("verify");
  const [nullifierHash, setNullifierHash] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const rateStartedAtRef = useRef<number | null>(null);

  function onVerified(hash: string) {
    persistWorkerNullifier(hash);
    setNullifierHash(hash);
    rateStartedAtRef.current = Date.now();
    setStep("rate");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setStep("submitting");

    const time_to_submit_ms =
      rateStartedAtRef.current != null ? Date.now() - rateStartedAtRef.current : null;

    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: task.id,
        nullifier_hash: nullifierHash,
        rating,
        feedback_text: feedback.trim(),
        time_to_submit_ms,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Submission failed." }));
      setErrorMsg(error ?? "Submission failed.");
      setStep("error");
      return;
    }

    persistWorkerNullifier(nullifierHash);
    setStep("done");
    router.refresh();
  }

  if (task.status === "closed") {
    return (
      <div className="form-card" style={{ textAlign: "center", padding: 32 }}>
        <p className="text-3xl mb-3">🔒</p>
        <p className="font-display text-xl text-white tracking-wider mb-1">TASK CLOSED</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No more submissions are being accepted.</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="form-card" style={{ textAlign: "center", padding: 32 }}>
        {/* Payment confirmation */}
        <div className="iris-container mx-auto mb-6" style={{ width: 72, height: 72 }} aria-hidden>
          <div className="iris-ring iris-ring-1" />
          <div className="iris-ring iris-ring-2" />
          <div className="iris-ring iris-ring-3" />
          <div className="iris-core" />
        </div>

        <p className="font-display text-3xl text-white tracking-wider mb-1">PAYMENT SENT!</p>
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
          <span style={{ color: "var(--gold)", fontWeight: 700 }}>{task.bounty_wld} WLD</span> has been sent to your World ID wallet.
        </p>

        <div className="hash-display">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>nullifier</span>
          <span className="text-xs font-mono break-all" style={{ color: "var(--signal)", fontFamily: "var(--font-mono)" }}>
            {nullifierHash.slice(0, 28)}…
          </span>
        </div>

        <div className="my-4 flex justify-center">
          <StarRating value={rating} readonly size="md" />
        </div>

        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          Rating {rating}/5 recorded. Thank you for your honest feedback.
        </p>

        <div className="flex flex-col gap-2">
          <a href="/dashboard" className="c-btn-gold w-full justify-center py-3">
            View your dashboard →
          </a>
          <a href="/tasks" className="c-btn-primary w-full justify-center py-3">
            Evaluate another task →
          </a>
        </div>

        <style>{`
          .hash-display {
            display: flex; flex-direction: column; gap: 4px;
            background: rgba(0,255,135,0.04);
            border: 1px solid var(--signal-border);
            border-radius: 10px; padding: 12px; margin-bottom: 16px;
            text-align: left;
          }
        `}</style>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="form-card" style={{ textAlign: "center", padding: 32 }}>
        <p className="text-3xl mb-3">✗</p>
        <p className="font-display text-xl text-white tracking-wider mb-1">SUBMISSION FAILED</p>
        <p className="text-sm mb-6" style={{ color: "var(--red)" }}>{errorMsg}</p>
        <button onClick={() => setStep("rate")} className="c-btn-ghost w-full justify-center py-3">
          Try again
        </button>
      </div>
    );
  }

  const verified = step !== "verify";

  return (
    <div className="form-card">
      {/* Bounty header */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-semibold text-white text-sm">Submit Evaluation</p>
        <span className="c-badge-gold" style={{ fontSize: "0.9rem", padding: "6px 14px" }}>
          ◈ {task.bounty_wld} WLD
        </span>
      </div>

      {/* Step 1: Verify */}
      <div className="step-section" style={{ opacity: verified ? 0.5 : 1, pointerEvents: verified ? "none" : "auto" }}>
        <div className="step-header">
          <div className="step-num-badge" style={{ background: verified ? "var(--signal)" : "var(--card-raised)", color: verified ? "#050507" : "var(--text-dim)", border: verified ? "none" : "1px solid var(--border-strong)" }}>
            {verified ? (
              <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : "1"}
          </div>
          <p className="text-sm font-semibold text-white">Verify you&apos;re human</p>
        </div>

        {!verified ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Prove you&apos;re a unique human using World ID. Your identity stays private.
            </p>
            <WorldIDButton taskId={task.id} onVerified={onVerified} />
          </div>
        ) : (
          <div className="verified-pill mt-2">
            <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="var(--signal)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Verified — unique human confirmed
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

      {/* Step 2: Rate & submit */}
      <div className="step-section" style={{ opacity: !verified ? 0.35 : 1, pointerEvents: !verified ? "none" : "auto" }}>
        <div className="step-header">
          <div className="step-num-badge" style={{ background: "var(--card-raised)", color: "var(--text-dim)", border: "1px solid var(--border-strong)" }}>
            2
          </div>
          <p className="text-sm font-semibold text-white">Rate &amp; submit</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="c-label">Your Rating</div>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          <div>
            <label className="c-label">
              Feedback <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>(required)</span>
            </label>
            <textarea
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what you evaluated, any issues found, and specific suggestions…"
              className="c-input resize-none"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>

          <button
            type="submit"
            disabled={step !== "rate" || rating === 0 || !feedback.trim()}
            className="c-btn-primary w-full justify-center py-3"
          >
            {step === "submitting" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "iris-spin 1s linear infinite" }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="20 14" />
                </svg>
                Submitting…
              </span>
            ) : (
              <>Submit &amp; Earn {task.bounty_wld} WLD</>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .form-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
        }
        .step-header {
          display: flex; align-items: center; gap: 10px;
        }
        .step-num-badge {
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
          transition: background 0.2s;
        }
        .step-section { }
        .verified-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600;
          color: var(--signal);
          background: var(--signal-dim);
          border: 1px solid var(--signal-border);
          border-radius: 100px; padding: 4px 10px;
        }
      `}</style>
    </div>
  );
}
