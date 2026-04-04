"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DINING_HALLS, DROP_OFF_BUILDINGS } from "@/lib/constants/buildings";
import { calculateConvenienceFee, formatCents } from "@/lib/utils/fee";

interface OrderFormProps {
  userId: string;
}

export default function OrderForm({ userId }: OrderFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [diningHall, setDiningHall] = useState("");
  const [items, setItems] = useState("");
  const [dropoffBuilding, setDropoffBuilding] = useState("");
  const [notes, setNotes] = useState("");
  const [mealCost, setMealCost] = useState("");

  const [feeBreakdown, setFeeBreakdown] = useState<ReturnType<typeof calculateConvenienceFee> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Recalculate fee whenever the relevant fields change
  useEffect(() => {
    if (diningHall && dropoffBuilding) {
      setFeeBreakdown(calculateConvenienceFee(diningHall, dropoffBuilding));
    } else {
      setFeeBreakdown(null);
    }
  }, [diningHall, dropoffBuilding]);

  const parsedMealCost = parseFloat(mealCost) || 0;
  const totalCharge = parsedMealCost + (feeBreakdown?.totalFee ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!feeBreakdown) {
      setError("Please select a dining hall and drop-off building.");
      return;
    }
    if (parsedMealCost < 0.01) {
      setError("Please enter an estimated meal cost.");
      return;
    }

    setLoading(true);

    // 1. Insert the order row
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        requester_id: userId,
        dining_hall: diningHall,
        items,
        dropoff_building: dropoffBuilding,
        notes: notes || null,
        meal_cost: parsedMealCost,
        convenience_fee: feeBreakdown.totalFee,
        status: "open",
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertError || !order) {
      setError(insertError?.message ?? "Failed to create order.");
      setLoading(false);
      return;
    }

    // 2. Create Stripe PaymentIntent
    // TODO: call /api/stripe/create-payment-intent, store payment_intent_id on order
    //   const res = await fetch("/api/stripe/create-payment-intent", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ orderId: order.id }),
    //   });
    //   const { clientSecret } = await res.json();
    //   store clientSecret in local state, redirect to payment step

    router.push(`/orders/${order.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dining hall */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dining Hall
        </label>
        <select
          required
          value={diningHall}
          onChange={(e) => setDiningHall(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CFB991] bg-white"
        >
          <option value="">Select dining hall…</option>
          {DINING_HALLS.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What do you want?
        </label>
        <textarea
          required
          rows={3}
          value={items}
          onChange={(e) => setItems(e.target.value)}
          placeholder="e.g. Grilled chicken sandwich, side salad, chocolate milk"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CFB991] resize-none"
        />
      </div>

      {/* Drop-off building */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Drop-off Building
        </label>
        <select
          required
          value={dropoffBuilding}
          onChange={(e) => setDropoffBuilding(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CFB991] bg-white"
        >
          <option value="">Select building…</option>
          {DROP_OFF_BUILDINGS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Estimated meal cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Meal Cost ($)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={mealCost}
          onChange={(e) => setMealCost(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
        />
        <p className="text-xs text-gray-400 mt-1">
          This is what you expect the meal to cost at the dining hall.
        </p>
      </div>

      {/* Optional notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. No onions, room 205, call when here"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
        />
      </div>

      {/* Fee breakdown */}
      {feeBreakdown && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-800">Fee Estimate</p>
          <div className="flex justify-between text-gray-600">
            <span>Meal cost (your estimate)</span>
            <span>{formatCents(parsedMealCost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Base convenience fee</span>
            <span>{formatCents(feeBreakdown.baseFee)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>
              Distance fee ({feeBreakdown.walkMinutes} min walk)
              {/* TODO: replace walk estimate with routing API */}
            </span>
            <span>{formatCents(feeBreakdown.distanceFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
            <span>Total charge</span>
            <span>{formatCents(totalCharge)}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#CFB991] text-black font-semibold py-3 hover:bg-[#EBD99F] transition-colors disabled:opacity-60"
      >
        {loading ? "Posting order…" : "Post Order"}
      </button>
    </form>
  );
}
