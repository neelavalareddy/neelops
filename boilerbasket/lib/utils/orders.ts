import { getBuildingById } from "@/lib/constants/buildings";
import { estimatedWalkMinutes } from "@/lib/utils/distance";
import { getDropoffLabel } from "@/lib/utils/dropoff";
import type { OrderRow, OrderStatus } from "@/types/database";

export function getOrderWalkMinutes(order: Pick<OrderRow, "dining_hall" | "dropoff_building">) {
  return estimatedWalkMinutes(order.dining_hall, order.dropoff_building);
}

export function getOrderAgeMinutes(createdAt: string, now = new Date()) {
  const created = new Date(createdAt).getTime();
  return Math.max(0, Math.round((now.getTime() - created) / 60000));
}

export function getOpportunityScore(order: Pick<OrderRow, "convenience_fee" | "dining_hall" | "dropoff_building" | "created_at">) {
  const walkMinutes = Math.max(getOrderWalkMinutes(order), 1);
  const ageBoost = Math.min(getOrderAgeMinutes(order.created_at) / 8, 3);
  return Number(((order.convenience_fee / walkMinutes) * 10 + ageBoost).toFixed(1));
}

export function getUrgency(order: Pick<OrderRow, "created_at" | "status">) {
  const ageMinutes = getOrderAgeMinutes(order.created_at);

  if (order.status !== "open") {
    return {
      label: "In progress",
      tone: "bg-gray-100 text-gray-600",
      description: "This order is already moving.",
    };
  }

  if (ageMinutes >= 20) {
    return {
      label: "Needs a picker",
      tone: "bg-red-50 text-red-700 border border-red-200",
      description: "This one has been waiting a while.",
    };
  }

  if (ageMinutes >= 10) {
    return {
      label: "Warm",
      tone: "bg-amber-50 text-amber-700 border border-amber-200",
      description: "Good time for someone to jump on it.",
    };
  }

  return {
    label: "Fresh",
    tone: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    description: "Recently posted and likely easy to coordinate.",
  };
}

export function getDeliveryWindow(order: Pick<OrderRow, "dining_hall" | "dropoff_building">) {
  const walkMinutes = getOrderWalkMinutes(order);
  const low = Math.max(10, Math.round(8 + walkMinutes * 1.2));
  const high = Math.max(low + 4, Math.round(14 + walkMinutes * 1.6));
  return { low, high, walkMinutes: Math.round(walkMinutes) };
}

export function getStatusMoments(order: Pick<OrderRow, "created_at" | "claimed_at" | "picked_up_at" | "delivered_at">) {
  return [
    { label: "Posted", at: order.created_at },
    { label: "Claimed", at: order.claimed_at },
    { label: "Picked up", at: order.picked_up_at },
    { label: "Delivered", at: order.delivered_at },
  ];
}

export function formatRelativeTime(dateString: string, now = new Date()) {
  const minutes = getOrderAgeMinutes(dateString, now);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function getRouteLabel(order: Pick<OrderRow, "dining_hall" | "dropoff_building">) {
  const from = getBuildingById(order.dining_hall)?.name ?? order.dining_hall;
  const to = getDropoffLabel(order.dropoff_building);
  return `${from} to ${to}`;
}

export function getStatusCopy(status: OrderStatus) {
  switch (status) {
    case "open":
      return "Waiting for a picker";
    case "claimed":
      return "A picker has committed to this run";
    case "picked_up":
      return "Food is on the move";
    case "delivered":
      return "Completed successfully";
    case "cancelled":
      return "No longer active";
    default:
      return "Status unavailable";
  }
}
