import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/ui/NavBar";
import { RatingBadge } from "@/components/ui/Badge";
import type { ReviewRow, UserRow } from "@/types/database";

interface Props {
  params: { id: string };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const profileId = id === "me" ? authUser.id : id;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", profileId)
    .single() as { data: UserRow | null; error: unknown };

  if (!profile) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20) as { data: ReviewRow[] | null; error: unknown };

  const isOwnProfile = authUser.id === profileId;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">

        {/* Profile header */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFB991] to-[#8E6F3E] flex items-center justify-center font-display text-2xl text-black shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-body text-xl font-bold text-gray-900 truncate">{profile.full_name}</h1>
            {isOwnProfile && (
              <p className="font-body text-sm text-gray-400 truncate">{profile.email}</p>
            )}
            <p className="font-body text-xs text-gray-400 mt-1">
              Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center space-y-2">
            <p className="font-body text-xs font-semibold text-gray-400 uppercase tracking-widest">As Requester</p>
            <RatingBadge rating={profile.rating_as_requester} count={profile.review_count_requester} />
            <p className="font-body text-xs text-gray-400">
              {profile.review_count_requester} review{profile.review_count_requester !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="card text-center space-y-2">
            <p className="font-body text-xs font-semibold text-gray-400 uppercase tracking-widest">As Picker</p>
            <RatingBadge rating={profile.rating_as_picker} count={profile.review_count_picker} />
            <p className="font-body text-xs text-gray-400">
              {profile.review_count_picker} review{profile.review_count_picker !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stripe Connect CTA */}
        {isOwnProfile && !profile.stripe_onboarding_complete && (
          <div className="card border-[#CFB991]/30 border-dashed border-2 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#CFB991]/10 flex items-center justify-center text-xl shrink-0">
                💰
              </div>
              <div>
                <p className="font-body font-semibold text-gray-900">Become a Picker — Set Up Payouts</p>
                <p className="font-body text-sm text-gray-500 mt-0.5">
                  Connect your bank account via Stripe to receive earnings from pickups.
                </p>
              </div>
            </div>
            <a
              href="/api/stripe/connect-onboarding"
              className="font-body inline-block rounded-xl bg-[#CFB991] text-black font-semibold px-5 py-2.5 text-sm hover:bg-[#EBD99F] transition-colors"
            >
              Set Up Payouts →
            </a>
          </div>
        )}

        {isOwnProfile && profile.stripe_onboarding_complete && (
          <div className="card flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm shrink-0">
              ✓
            </div>
            <div>
              <p className="font-body font-semibold text-gray-900 text-sm">Payouts connected</p>
              <p className="font-body text-xs text-gray-400">You&apos;ll receive picker earnings directly to your bank account.</p>
            </div>
          </div>
        )}

        {/* Reviews */}
        <section>
          <h2 className="font-body text-lg font-bold text-gray-900 mb-4">
            Reviews {reviews?.length ? `(${reviews.length})` : ""}
          </h2>
          {!reviews?.length ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="font-body text-gray-400 text-sm">No reviews yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function ReviewCard({ review }: { review: ReviewRow }) {
  return (
    <li className="card space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm">
            {"★".repeat(review.rating)}
            <span className="text-gray-200">{"★".repeat(5 - review.rating)}</span>
          </span>
          <span className="font-body text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded-full">
            {review.reviewee_role}
          </span>
        </div>
        <span className="font-body text-xs text-gray-400">
          {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      {review.comment && (
        <p className="font-body text-sm text-gray-700">{review.comment}</p>
      )}
    </li>
  );
}
