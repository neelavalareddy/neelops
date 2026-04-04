import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/release-payout
 *
 * Called when a picker marks an order as delivered.
 * 1. Captures the held PaymentIntent (escrow → captured).
 * 2. Creates a Stripe Transfer to the picker's Connect account.
 * 3. Records the transfer id on the order row.
 *
 * Must be called server-side only; the requester's session is checked to
 * prevent arbitrary users from triggering payouts.
 *
 * TODO: Consider moving this logic entirely into the Stripe webhook
 * (payment_intent.succeeded) so the payout is guaranteed even if the client
 * call fails or the user closes the tab before the fetch completes.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Use service client so we can update regardless of RLS picker_id check
    const service = createServiceClient();

    const { data: order, error: fetchError } = await service
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only the picker can trigger payout
    if (order.picker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json({ error: "Order not yet delivered" }, { status: 400 });
    }

    if (!order.payment_intent_id) {
      return NextResponse.json({ error: "No payment intent on this order" }, { status: 400 });
    }

    if (order.payment_status === "released") {
      return NextResponse.json({ ok: true, message: "Payout already released" });
    }

    // ── Step 1: Capture the held PaymentIntent ────────────────────────────
    await stripe.paymentIntents.capture(order.payment_intent_id);

    // ── Step 2: Transfer funds to picker's Stripe Connect account ─────────
    // TODO: implement Stripe Connect transfer once picker has completed onboarding.
    // Fetch picker's stripe_account_id from users table and create transfer.
    //
    // const { data: picker } = await service
    //   .from("users")
    //   .select("stripe_account_id, stripe_onboarding_complete")
    //   .eq("id", order.picker_id)
    //   .single();
    //
    // if (picker?.stripe_onboarding_complete && picker.stripe_account_id) {
    //   const amountCents = Math.round(order.total_charge * 100);
    //   // Subtract platform fee (e.g. 10%) — adjust as needed
    //   const payoutCents = Math.round(amountCents * 0.9);
    //   const transfer = await stripe.transfers.create({
    //     amount: payoutCents,
    //     currency: "usd",
    //     destination: picker.stripe_account_id,
    //     source_transaction: order.payment_intent_id, // ties transfer to the charge
    //     metadata: { order_id: orderId },
    //   });
    //   await service
    //     .from("orders")
    //     .update({ payout_transfer_id: transfer.id, payment_status: "released" })
    //     .eq("id", orderId);
    // }

    // For now, just mark the payment as released
    await service
      .from("orders")
      .update({ payment_status: "released" })
      .eq("id", orderId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[release-payout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
