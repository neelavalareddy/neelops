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

interface Props {
  order: OrderRow;
  userId: string;
  isRequester: boolean;
  isPicker: boolean;
  myReviews: ReviewRow[];
}

export default function OrderDetail({ order: initialOrder, userId, isRequester, isPicker, myReviews }: Props) {
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
  const dropoffName = getBuildingById(order.dropoff_building)?.name ?? order.dropoff_building;

  async function updateStatus(newStatus: OrderStatus) {
    setError(null);
    setLoading(true);

    const patch: Partial<OrderRow> = { status: newStatus };
    if (newStatus === "claimed")    patch.claimed_at = new Date().toISOString();
    if (newStatus === "picked_up")  patch.picked_up_at = new Date().toISOString();
    if (newStatus === "delivered")  patch.delivered_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", order.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setOrder((prev) => ({ ...prev, ...patch }));

      if (newStatus === "delivered") {
        // Trigger Stripe Connect payout — capture the held PaymentIntent
        // and transfer funds to the picker's Connect account.
        fetch("/api/stripe/release-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        }).catch((err) => console.error("[release-payout]", err));
        router.refresh();
      }
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
      .eq("status", "open"); // optimistic lock — only claim if still open

    if (updateError) {
      setError("Could not claim this order. Someone may have already grabbed it.");
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

  const canClaim = order.status === "open" && !isRequester && !isPicker;
  const canMarkPickedUp = isPicker && order.status === "claimed";
  const canMarkDelivered = isPicker && order.status === "picked_up";
  const isDelivered = order.status === "delivered";

  const hasReviewedPicker = myReviews.some((r) => r.reviewee_role === "picker");
  const hasReviewedRequester = myReviews.some((r) => r.reviewee_role === "requester");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{diningHallName}</h1>
          <p className="text-gray-500 mt-1">→ {dropoffName}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Order details */}
      <div className="card space-y-4">
        <Field label="Items" value={order.items} />
        {order.notes && <Field label="Notes" value={order.notes} />}
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
