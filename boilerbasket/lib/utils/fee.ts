import { estimatedWalkMinutes } from "@/lib/utils/distance";

const BASE_FEE = 1.20;           // flat fee when picker uses a meal swipe
const DISTANCE_RATE = 0.10;      // $ per additional walk-minute

/**
 * Calculates the convenience fee.
 *
 * Formula:
 *   convenience_fee = $1.20 (base) + ($0.10 × walk_minutes)
 *
 * The first minute of walking is included in the base; distance fee kicks in
 * for any additional walking time.
 *
 * TODO: consider a minimum threshold before the distance surcharge applies.
 */
export function calculateConvenienceFee(
  diningHallId: string,
  dropoffBuildingId: string
): { baseFee: number; distanceFee: number; totalFee: number; walkMinutes: number } {
  const walkMinutes = estimatedWalkMinutes(diningHallId, dropoffBuildingId);
  const distanceFee = Math.max(0, walkMinutes - 1) * DISTANCE_RATE;
  const totalFee = BASE_FEE + distanceFee;

  return {
    baseFee: BASE_FEE,
    distanceFee: parseFloat(distanceFee.toFixed(2)),
    totalFee: parseFloat(totalFee.toFixed(2)),
    walkMinutes: parseFloat(walkMinutes.toFixed(1)),
  };
}

/** Format a dollar amount for display */
export function formatCents(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
