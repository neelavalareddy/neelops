import type { OrderStatus } from "@/types/database";

const STATUS_STYLES: Record<OrderStatus, string> = {
  open:       "bg-blue-100 text-blue-800",
  claimed:    "bg-yellow-100 text-yellow-800",
  picked_up:  "bg-orange-100 text-orange-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  open:       "Open",
  claimed:    "Claimed",
  picked_up:  "Picked Up",
  delivered:  "Delivered",
  cancelled:  "Cancelled",
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`badge ${STATUS_STYLES[status]} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface RatingBadgeProps {
  rating: number | null;
  count?: number;
}

export function RatingBadge({ rating, count }: RatingBadgeProps) {
  if (rating == null) {
    return <span className="text-gray-400 text-sm">No ratings yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium">
      <span className="text-yellow-500">★</span>
      {rating.toFixed(1)}
      {count != null && (
        <span className="text-gray-400 font-normal">({count})</span>
      )}
    </span>
  );
}
