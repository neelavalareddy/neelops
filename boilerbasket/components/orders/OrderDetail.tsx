"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/utils/fee";
import ReviewForm from "@/components/reviews/ReviewForm";
import PaymentSection from "@/components/payments/PaymentSection";
import type { OrderRow, ReviewRow, OrderStatus } from "@/types/database";
import { getBuildingById } from "@/lib/constants/buildings";
import { getDropoffLabel } from "@/lib/utils/dropoff";
import {
  formatRelativeTime,
  getDeliveryWindow,
  getStatusCopy,
  getStatusMoments,
  getUrgency,
} from "@/lib/utils/orders";

interface Props {
  order: OrderRow;
  userId: string;
  isRequester: boolean;
  isPicker: boolean;
  myReviews: ReviewRow[];
  paymentSuccess?: boolean;
}

export default function OrderDetail({ order: initialOrder, userId, isRequester, isPicker, myReviews, paymentSuccess }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [order, setOrder] = useState<OrderRow>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Supabase Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`order:${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => setOrder(payload.new as OrderRow)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  const diningHallName = getBuildingById(order.dining_hall)?.name ?? order.dining_hall;
  const dropoffName = getDropoffLabel(order.dropoff_building);
  const urgency = getUrgency(order);
  const deliveryWindow = getDeliveryWindow(order);
  const timeline = getStatusMoments(order);

  async function updateStatus(newStatus: OrderStatus) {
    setError(null);
    setLoading(true);

    if (newStatus === "delivered") {
      const res = await fetch("/api/orders/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const payload = await res
        .json()
        .catch(() => ({ error: "Failed to complete delivery." }));

      if (!res.ok) {
        setError(payload.error ?? "Failed to complete delivery.");
      } else {
        setOrder((prev) => ({
          ...prev,
          status: "delivered",
          delivered_at: prev.delivered_at ?? new Date().toISOString(),
          payment_status: payload.paymentStatus ?? prev.payment_status,
          payout_transfer_id: payload.payoutTransferId ?? prev.payout_transfer_id,
        }));
        router.refresh();
      }

      setLoading(false);
      return;
    }

    const patch: Partial<OrderRow> = { status: newStatus };
    if (newStatus === "claimed") patch.claimed_at = new Date().toISOString();
    if (newStatus === "picked_up") patch.picked_up_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", order.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setOrder((prev) => ({ ...prev, ...patch }));
    }

    setLoading(false);
  }

  async function cancelOrder() {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setError(null);
    setLoading(true);

    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: "Failed to cancel order." }));
      setError(msg ?? "Failed to cancel order.");
    } else {
      setOrder((prev) => ({ ...prev, status: "cancelled" }));
    }

    setLoading(false);
  }

  async function claimOrder() {
    setError(null);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        picker_id: userId,
        status: "claimed",
        claimed_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("status", "open")
      .eq("payment_status", "held"); // only claim if payment is already authorized

    if (updateError) {
      setError("Could not claim this order. It may already be claimed or still waiting on payment.");
    } else {
      setOrder((prev) => ({
        ...prev,
        picker_id: userId,
        status: "claimed",
        claimed_at: new Date().toISOString(),
      }));
    }

    setLoading(false);
  }

  const paymentReady = ["held", "captured", "released"].includes(order.payment_status);
  const canClaim = order.status === "open" && order.payment_status === "held" && !isRequester && !isPicker;
  const canMarkPickedUp = isPicker && order.status === "claimed";
  const canMarkDelivered = isPicker && order.status === "picked_up" && order.payment_status === "held";
  const canCancel = isRequester && order.status === "open";
  const isDelivered = order.status === "delivered";

  const hasReviewedPicker = myReviews.some((r) => r.reviewee_role === "picker");
  const hasReviewedRequester = myReviews.some((r) => r.reviewee_role === "requester");

  return (
    <div className="space-y-6">
      {/* Payment confirmed banner */}
      {paymentSuccess && order.payment_status === "held" && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3 text-sm text-green-800">
          <span className="text-lg">✓</span>
          <div>
            <p className="font-semibold">Payment authorized!</p>
            <p className="text-green-700">Your funds are held in escrow and will be released to your picker on delivery.</p>
          </div>
        </div>
      )}

      {order.status === "open" && !paymentReady && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {isRequester
            ? "Complete payment to make this order available for pickers."
            : "This order is waiting for the requester to complete payment before it can be claimed."}
        </div>
      )}

      {isDelivered && order.payment_status === "captured" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          Delivery is complete and funds were captured. Payout will be sent after the picker finishes Stripe onboarding.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{diningHallName}</h1>
          <p className="text-gray-500 mt-1">→ {dropoffName}</p>
          <p className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 bg-gray-100">
            {getStatusCopy(order.status)}
          </p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Order Timeline</h2>
            <span className={`badge ${urgency.tone}`}>{urgency.label}</span>
          </div>
          <ol className="space-y-3">
            {timeline.map((step, index) => {
              const completed = Boolean(step.at);
              return (
                <li key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        completed
                          ? "bg-[#CFB991] text-black"
                          : "border border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className={`mt-2 w-px flex-1 ${completed ? "bg-[#CFB991]/50" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pb-4 pt-1">
                    <p className="font-semibold text-gray-900">{step.label}</p>
                    <p className="text-sm text-gray-500">
                      {step.at ? `${new Date(step.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} • ${formatRelativeTime(step.at)}` : "Waiting for this step"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="card space-y-4 bg-gradient-to-br from-white to-[#faf7ef]">
          <h2 className="text-lg font-bold text-gray-900">Delivery Intel</h2>
          <div className="grid grid-cols-2 gap-3">
            <InfoTile label="Walk time" value={`${deliveryWindow.walkMinutes} min`} />
            <InfoTile label="ETA" value={`${deliveryWindow.low}-${deliveryWindow.high} min`} />
            <InfoTile label="Posted" value={formatRelativeTime(order.created_at)} />
            <InfoTile label="Payment" value={order.payment_status} />
          </div>
          <div className="rounded-xl border border-[#CFB991]/20 bg-white/70 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Best handoff plan</p>
            <p className="mt-1">
              Meet near {dropoffName}. Shorter routes like this usually finish smoothly when the picker heads out right after pickup.
            </p>
          </div>
          {order.notes && (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Requester notes</p>
              <p className="mt-1">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order details */}
      <div className="card space-y-4">
        <Field label="Items" value={order.items} />
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100 text-sm">
          <div>
            <p className="text-gray-500">Meal cost</p>
            <p className="font-semibold">{formatCents(order.meal_cost)}</p>
          </div>
          <div>
            <p className="text-gray-500">Convenience fee</p>
            <p className="font-semibold">{formatCents(order.convenience_fee)}</p>
          </div>
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-bold">{formatCents(order.total_charge)}</p>
          </div>
        </div>
      </div>

      {/* Payment */}
      {isRequester && order.status === "open" && order.payment_status === "pending" && (
        <PaymentSection orderId={order.id} totalCharge={order.total_charge} />
      )}

      {/* Picker action buttons */}
      {canCancel && (
        <button
          onClick={cancelOrder}
          disabled={loading}
          className="w-full rounded-xl border border-red-200 text-red-600 font-semibold py-3 hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          {loading ? "Cancelling…" : "Cancel Order"}
        </button>
      )}

      {canClaim && (
        <button
          onClick={claimOrder}
          disabled={loading}
          className="w-full rounded-xl bg-[#CFB991] text-black font-semibold py-3 hover:bg-[#EBD99F] transition-colors disabled:opacity-60"
        >
          {loading ? "Claiming…" : "Claim This Order"}
        </button>
      )}

      {canMarkPickedUp && (
        <button
          onClick={() => updateStatus("picked_up")}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 text-white font-semibold py-3 hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {loading ? "Updating…" : "Mark as Picked Up"}
        </button>
      )}

      {canMarkDelivered && (
        <button
          onClick={() => updateStatus("delivered")}
          disabled={loading}
          className="w-full rounded-xl bg-green-600 text-white font-semibold py-3 hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Updating…" : "Mark as Delivered"}
        </button>
      )}

      {/* Post-delivery reviews */}
      {isDelivered && order.picker_id && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Reviews</h2>

          {/* Requester reviews the picker */}
          {isRequester && !hasReviewedPicker && (
            <ReviewForm
              orderId={order.id}
              reviewerId={userId}
              revieweeId={order.picker_id}
              revieweeRole="picker"
              label="Rate your picker"
            />
          )}

          {/* Picker reviews the requester */}
          {isPicker && !hasReviewedRequester && (
            <ReviewForm
              orderId={order.id}
              reviewerId={userId}
              revieweeId={order.requester_id}
              revieweeRole="requester"
              label="Rate the requester"
            />
          )}

          {(hasReviewedPicker || hasReviewedRequester) && (
            <p className="text-sm text-gray-500">Review submitted. Thanks!</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-gray-900">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-black/5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}
