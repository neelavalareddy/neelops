import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Flag if this rater always submits the same star rating across several tasks (possible lazy bot).
 * Optional: very short time from "ready to rate" to submit (client-reported ms).
 */
export async function computeSuspiciousFlags(
  supabase: SupabaseClient,
  nullifier_hash: string,
  newRating: number,
  time_to_submit_ms: number | null | undefined,
  feedbackCharCount: number
): Promise<boolean> {
  const { data: history } = await supabase
    .from("responses")
    .select("rating")
    .eq("nullifier_hash", nullifier_hash)
    .order("created_at", { ascending: false })
    .limit(9);

  const prev = (history ?? []).map((r) => r.rating);
  const allSame =
    prev.length >= 2 &&
    prev.every((r) => r === newRating) &&
    newRating === prev[0];

  const tooFast =
    typeof time_to_submit_ms === "number" &&
    time_to_submit_ms >= 0 &&
    time_to_submit_ms < 10_000 &&
    feedbackCharCount < 120;

  return allSame || tooFast;
}
