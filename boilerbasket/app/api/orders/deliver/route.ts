import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { OrderRow, PaymentStatus, UserRow } from "@/types/database";

function getChargeId(paymentIntent: Stripe.PaymentIntent) {
  return typeof paymentIntent.latest_charge === "string"
    ? paymentIntent.latest_charge
    : paymentIntent.latest_charge?.id ?? null;
}

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

    const service = createServiceClient();
    const { data: order, error: fetchError } = (await service
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()) as { data: OrderRow | null; error: unknown };

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.picker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!order.payment_intent_id) {
      return NextResponse.json(
        { error: "Payment must be authorized before delivery." },
        { status: 400 }
      );
    }

    if (order.status !== "picked_up" && order.status !== "delivered") {
      return NextResponse.json(
        { error: "Only picked-up orders can be marked as delivered." },
        { status: 400 }
      );
    }

    if (!["held", "captured", "released"].includes(order.payment_status)) {
      return NextResponse.json(
        { error: "Payment must be authorized before delivery." },
        { status: 400 }
      );
    }

    let paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id, {
      expand: ["latest_charge"],
    });

    if (paymentIntent.status === "requires_capture") {
      paymentIntent = await stripe.paymentIntents.capture(
        order.payment_intent_id,
        { expand: ["latest_charge"] },
        { idempotencyKey: `deliver-capture:${order.id}` }
      );
    } else if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment is not ready to be captured." },
        { status: 400 }
      );
    }

    const { data: picker } = (await service
      .from("users")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", order.picker_id)
      .single()) as {
      data: Pick<UserRow, "stripe_account_id" | "stripe_onboarding_complete"> | null;
      error: unknown;
    };

    let payoutTransferId = order.payout_transfer_id;
    let paymentStatus: PaymentStatus = payoutTransferId ? "released" : "captured";

    if (
      picker?.stripe_onboarding_complete &&
      picker.stripe_account_id &&
      !payoutTransferId
    ) {
      const amountCents = Math.round(order.total_charge * 100);
      const payoutCents = Math.round(amountCents * 0.9);
      const chargeId = getChargeId(paymentIntent);

      const transfer = await stripe.transfers.create(
        {
          amount: payoutCents,
          currency: "usd",
          destination: picker.stripe_account_id,
          ...(chargeId ? { source_transaction: chargeId } : {}),
          metadata: { order_id: order.id },
        },
        {
          idempotencyKey: `deliver-transfer:${order.id}`,
        }
      );

      payoutTransferId = transfer.id;
      paymentStatus = "released";
    }

    const deliveredAt = order.delivered_at ?? new Date().toISOString();
    const { error: updateError } = await service
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: deliveredAt,
        payment_status: paymentStatus,
        payout_transfer_id: payoutTransferId,
      })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      paymentStatus,
      payoutTransferId,
    });
  } catch (err) {
    console.error("[deliver-order]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
