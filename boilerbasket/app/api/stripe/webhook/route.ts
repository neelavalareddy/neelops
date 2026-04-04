import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Tell Next.js not to parse the body — Stripe needs the raw bytes to verify signature
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    // ── Payment authorized (card authorized, funds held) ─────────────────
    case "payment_intent.amount_capturable_updated": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.order_id;

      if (orderId) {
        await supabase
          .from("orders")
          .update({ payment_status: "held" })
          .eq("id", orderId);
      }
      break;
    }

    // ── Payment captured (delivery confirmed, funds captured) ─────────────
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.order_id;

      if (orderId) {
        await supabase
          .from("orders")
          .update({ payment_status: "captured" })
          .eq("id", orderId);
      }
      break;
    }

    // ── Cancellation / refund ────────────────────────────────────────────
    case "payment_intent.canceled":
    case "charge.refunded": {
      const obj = event.data.object as Stripe.PaymentIntent | Stripe.Charge;
      // payment_intent is on Charge (may be string or expanded object), id on PaymentIntent
      const rawPi = "payment_intent" in obj ? obj.payment_intent : obj.id;
      const piId = typeof rawPi === "string" ? rawPi : rawPi?.id ?? null;

      if (piId) {
        await supabase
          .from("orders")
          .update({ payment_status: "refunded" })
          .eq("payment_intent_id", piId);
      }
      break;
    }

    // ── Stripe Connect: onboarding complete ─────────────────────────────
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      // charges_enabled flips to true once the picker completes KYC/onboarding
      if (account.charges_enabled) {
        await supabase
          .from("users")
          .update({ stripe_onboarding_complete: true })
          .eq("stripe_account_id", account.id);
      }
      break;
    }

    // TODO: handle transfer.created to record payout confirmation

    default:
      // Ignore unhandled events
      break;
  }

  return NextResponse.json({ received: true });
}
