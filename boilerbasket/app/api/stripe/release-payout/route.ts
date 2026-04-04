import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { OrderRow, UserRow } from "@/types/database";

export const dynamic = "force-dynamic";

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
      .single() as { data: OrderRow | null; error: unknown };

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

    const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id, {
      expand: ["latest_charge"],
    });

    const capturedPI =
      paymentIntent.status === "requires_capture"
        ? await stripe.paymentIntents.capture(
            order.payment_intent_id,
            { expand: ["latest_charge"] },
            { idempotencyKey: `release-capture:${order.id}` }
          )
        : paymentIntent;

    if (capturedPI.status !== "succeeded") {
      return NextResponse.json({ error: "Payment is not ready to be released" }, { status: 400 });
    }

    // ── Step 2: Transfer funds to picker's Stripe Connect account ─────────
    const { data: picker } = await service
      .from("users")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", order.picker_id)
      .single() as { data: Pick<UserRow, "stripe_account_id" | "stripe_onboarding_complete"> | null; error: unknown };

    if (picker?.stripe_onboarding_complete && picker.stripe_account_id) {
      const amountCents = Math.round(order.total_charge * 100);
      // Subtract 10% platform fee
      const payoutCents = Math.round(amountCents * 0.9);

      // source_transaction must be the charge ID (ch_...), not the PI ID
      const chargeId =
        typeof capturedPI.latest_charge === "string"
          ? capturedPI.latest_charge
          : capturedPI.latest_charge?.id;

      const transfer = await stripe.transfers.create(
        {
          amount: payoutCents,
          currency: "usd",
          destination: picker.stripe_account_id,
          ...(chargeId ? { source_transaction: chargeId } : {}),
          metadata: { order_id: orderId },
        },
        {
          idempotencyKey: `release-transfer:${order.id}`,
        }
      );

      await service
        .from("orders")
        .update({ payout_transfer_id: transfer.id, payment_status: "released" })
        .eq("id", orderId);
    } else {
      // Picker hasn't completed Stripe Connect onboarding yet —
      // payment is captured; payout will be triggered once they onboard.
      await service
        .from("orders")
        .update({ payment_status: "captured" })
        .eq("id", orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[release-payout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
