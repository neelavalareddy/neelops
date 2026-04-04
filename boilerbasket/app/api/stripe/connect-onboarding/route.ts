import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates (or resumes) a Stripe Connect Express onboarding link for the
 * authenticated user so they can receive picker payouts.
 *
 * Flow:
 *   1. User clicks "Set Up Payouts" on their profile
 *   2. GET /api/stripe/connect-onboarding
 *   3. We create/reuse their Stripe Connect account
 *   4. We generate an AccountLink and redirect the user to Stripe
 *   5. After onboarding, Stripe redirects to /profile/me?connected=true
 *   6. We listen for account.updated webhook to flip stripe_onboarding_complete
 *
 * TODO: Handle the return URL flow — verify onboarding actually completed
 * before setting stripe_onboarding_complete = true. Do this in the webhook
 * handler on account.updated with charges_enabled = true.
 */
export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect("/login");
    }

    // Fetch existing profile
    const { data: profile } = await supabase
      .from("users")
      .select("stripe_account_id, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let stripeAccountId = profile.stripe_account_id;

    // Create a new Stripe Express account if one doesn't exist yet
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { user_id: user.id },
      });

      stripeAccountId = account.id;

      await supabase
        .from("users")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", user.id);
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect-onboarding`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/me?connected=true`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error("[connect-onboarding]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
