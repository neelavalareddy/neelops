import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import type { OrderRow } from "@/types/database";

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

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("requester_id", user.id) // requester must own the order
      .single() as { data: OrderRow | null; error: unknown };

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "open") {
      return NextResponse.json(
        { error: "Only open orders can be cancelled." },
        { status: 400 }
      );
    }

    // Cancel the Stripe PaymentIntent if one was created (funds never held yet)
    if (order.payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(order.payment_intent_id);
      } catch {
        // PI may already be cancelled or in a non-cancellable state — continue
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled", payment_status: order.payment_intent_id ? "refunded" : "pending" })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cancel-order]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
