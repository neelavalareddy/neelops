"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { formatCents } from "@/lib/utils/fee";

// Initialize Stripe outside of render to avoid recreating the object
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentSectionProps {
  orderId: string;
  totalCharge: number;
}

export default function PaymentSection({ orderId, totalCharge }: PaymentSectionProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: create PaymentIntent on the server and return clientSecret
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setFetchError(data.error ?? "Failed to initialize payment.");
        }
      })
      .catch(() => setFetchError("Network error. Please try again."));
  }, [orderId]);

  if (fetchError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {fetchError}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#8E6F3E" },
        },
      }}
    >
      <CheckoutForm totalCharge={totalCharge} orderId={orderId} />
    </Elements>
  );
}

function CheckoutForm({
  totalCharge,
  orderId,
}: {
  totalCharge: number;
  orderId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?payment=success`,
      },
    });

    // If we're here, confirmPayment redirected or errored
    if (error) {
      setMessage(error.message ?? "Payment failed.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Payment</h2>
        <span className="text-lg font-bold">{formatCents(totalCharge)}</span>
      </div>

      {/*
        Stripe Payment Element renders card, Apple Pay, Google Pay,
        PayPal, Venmo etc. based on what's enabled in your Stripe Dashboard.
        TODO: Enable PayPal and Venmo in the Stripe Dashboard under
        Settings > Payment Methods.
      */}
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {message && (
        <p className="text-sm text-red-600">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full rounded-xl bg-[#CFB991] text-black font-semibold py-3 hover:bg-[#EBD99F] transition-colors disabled:opacity-60"
      >
        {loading ? "Processing…" : `Pay ${formatCents(totalCharge)}`}
      </button>

      <p className="text-xs text-center text-gray-400">
        Payment is held in escrow and released to your picker on delivery.
      </p>
    </form>
  );
}
