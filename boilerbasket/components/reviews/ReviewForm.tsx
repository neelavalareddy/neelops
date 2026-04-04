"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RevieweeRole } from "@/types/database";

interface ReviewFormProps {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeRole: RevieweeRole;
  label: string;
}

export default function ReviewForm({
  orderId,
  reviewerId,
  revieweeId,
  revieweeRole,
  label,
}: ReviewFormProps) {
  const supabase = createClient();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setError(null);
    setLoading(true);

    const { error: insertError } = await supabase.from("reviews").insert({
      order_id: orderId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      reviewee_role: revieweeRole,
      rating,
      comment: comment || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Thanks for your review!
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <p className="font-medium text-gray-800">{label}</p>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Star selector */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-colors"
            aria-label={`${star} star`}
          >
            <span className={(hovered || rating) >= star ? "text-yellow-400" : "text-gray-200"}>
              ★
            </span>
          </button>
        ))}
      </div>

      {/* Optional comment */}
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment…"
        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CFB991] resize-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[#CFB991] text-black font-semibold px-5 py-2 text-sm hover:bg-[#EBD99F] transition-colors disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
