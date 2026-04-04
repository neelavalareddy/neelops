import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/ui/NavBar";
import { RatingBadge } from "@/components/ui/Badge";
import type { ReviewRow } from "@/types/database";

interface Props {
  params: { id: string };
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // "me" shortcut
  const profileId = params.id === "me" ? authUser.id : params.id;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", profileId)
    .single();

  if (!profile) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const isOwnProfile = authUser.id === profileId;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">

        {/* Profile header */}
        <div className="card flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#CFB991] flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.full_name}</h1>
            {isOwnProfile && (
              <p className="text-sm text-gray-400 truncate">{profile.email}</p>
            )}
          </div>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">As Requester</p>
            <RatingBadge
              rating={profile.rating_as_requester}
              count={profile.review_count_requester}
            />
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">As Picker</p>
            <RatingBadge
              rating={profile.rating_as_picker}
              count={profile.review_count_picker}
            />
          </div>
        </div>

        {/* Stripe Connect CTA for own profile */}
        {isOwnProfile && !profile.stripe_onboarding_complete && (
          <div className="card border-dashed border-2 border-[#CFB991] space-y-3">
            <p className="font-semibold">Become a Picker — Set Up Payouts</p>
            <p className="text-sm text-gray-500">
              Connect your bank account via Stripe to receive earnings from pickups.
            </p>
            {/* TODO: redirect to Stripe Connect onboarding link from /api/stripe/connect-onboarding */}
            <a
              href="/api/stripe/connect-onboarding"
              className="inline-block rounded-xl bg-[#CFB991] text-black font-semibold px-5 py-2 text-sm hover:bg-[#EBD99F] transition-colors"
            >
              Set Up Payouts
            </a>
          </div>
        )}

        {/* Reviews */}
        <section>
          <h2 className="text-lg font-bold mb-4">Reviews</h2>
          {!reviews?.length ? (
            <p className="text-gray-500 text-sm">No reviews yet.</p>
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
    <li className="card space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wide">{review.reviewee_role}</span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-700">{review.comment}</p>
      )}
      <p className="text-xs text-gray-400">
        {new Date(review.created_at).toLocaleDateString()}
      </p>
    </li>
  );
}
