import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

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

    // Fetch order to get the charge amount
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("requester_id", user.id) // requester must own the order
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status !== "pending") {
      return NextResponse.json({ error: "Payment already initialized" }, { status: 400 });
    }

    // TODO: resolve picker's Stripe Connect account id so we can set transfer_data
    // once the order is claimed. For now we create a plain PaymentIntent and
    // capture/transfer later in the webhook.

    const amountCents = Math.round(order.total_charge * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      capture_method: "manual", // hold funds in escrow; capture on delivery
      metadata: {
        order_id: orderId,
        requester_id: user.id,
      },
      // TODO: add transfer_data when picker's Stripe account is known:
      // transfer_data: { destination: pickerStripeAccountId },
    });

    // Store the payment intent id on the order
    await supabase
      .from("orders")
      .update({ payment_intent_id: paymentIntent.id })
      .eq("id", orderId);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[create-payment-intent]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
