"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BUILDINGS, DINING_HALLS, DROP_OFF_BUILDINGS } from "@/lib/constants/buildings";
import { calculateConvenienceFee, formatCents } from "@/lib/utils/fee";
import { estimatedWalkMinutes } from "@/lib/utils/distance";
import { encodePinnedDropoff, findNearestBuilding, getDropoffLabel, getPinnedDropoffSummary } from "@/lib/utils/dropoff";

const ORDER_PRESETS = [
  {
    label: "Quick lunch",
    items: "Chicken sandwich, fries, and a drink",
    notes: "Text me when you leave the dining court.",
  },
  {
    label: "Protein run",
    items: "Double protein entree, fruit cup, and water",
    notes: "If one item is unavailable, substitute something similar.",
  },
  {
    label: "Late-night comfort",
    items: "Pizza slices, cookie, and chocolate milk",
    notes: "Please bring napkins if possible.",
  },
];

const CAMPUS_BOUNDS = BUILDINGS.reduce(
  (bounds, building) => ({
    minLat: Math.min(bounds.minLat, building.lat),
    maxLat: Math.max(bounds.maxLat, building.lat),
    minLng: Math.min(bounds.minLng, building.lng),
    maxLng: Math.max(bounds.maxLng, building.lng),
  }),
  {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
  }
);

const MAP_PADDING = {
  lat: 0.0016,
  lng: 0.0024,
};

const MAP_VIEW_SPAN = {
  lat: 0.0105,
  lng: 0.015,
};

const DEFAULT_PIN_CENTER = {
  lat: 40.4264,
  lng: -86.9162,
};

interface OrderFormProps {
  userId: string;
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface DragState {
  x: number;
  y: number;
  center: Coordinate;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampCenter(center: Coordinate): Coordinate {
  return {
    lat: clamp(center.lat, CAMPUS_BOUNDS.minLat - MAP_PADDING.lat, CAMPUS_BOUNDS.maxLat + MAP_PADDING.lat),
    lng: clamp(center.lng, CAMPUS_BOUNDS.minLng - MAP_PADDING.lng, CAMPUS_BOUNDS.maxLng + MAP_PADDING.lng),
  };
}

function distanceBetweenPoints(a: Coordinate, b: Coordinate) {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

function getMarkerPosition(target: Coordinate, center: Coordinate) {
  return {
    left: 50 + ((target.lng - center.lng) / MAP_VIEW_SPAN.lng) * 100,
    top: 50 - ((target.lat - center.lat) / MAP_VIEW_SPAN.lat) * 100,
  };
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

export default function OrderForm({ userId }: OrderFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const [diningHall, setDiningHall] = useState("");
  const [items, setItems] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pinCenter, setPinCenter] = useState<Coordinate>(DEFAULT_PIN_CENTER);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "ready" | "denied" | "error">("idle");
  const [notes, setNotes] = useState("");
  const [mealCost, setMealCost] = useState("");

  const [feeBreakdown, setFeeBreakdown] = useState<ReturnType<typeof calculateConvenienceFee> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedDiningHall = BUILDINGS.find((building) => building.id === diningHall);
  const pinnedLabel = getPinnedDropoffSummary(pinCenter.lat, pinCenter.lng);
  const nearestBuilding = findNearestBuilding(pinCenter.lat, pinCenter.lng);
  const parsedMealCost = parseFloat(mealCost) || 0;
  const totalCharge = parsedMealCost + (feeBreakdown?.totalFee ?? 0);
  const nearbyLandmarks = [...DROP_OFF_BUILDINGS]
    .map((building) => ({
      ...building,
      proximity: distanceBetweenPoints({ lat: building.lat, lng: building.lng }, pinCenter),
    }))
    .sort((a, b) => a.proximity - b.proximity)
    .slice(0, 3);
  const suggestedDropoffs = diningHall
    ? [...DROP_OFF_BUILDINGS]
        .map((building) => ({
          ...building,
          walkMinutes: estimatedWalkMinutes(diningHall, building.id),
        }))
        .sort((a, b) => a.walkMinutes - b.walkMinutes)
        .slice(0, 3)
    : [];
  const appealLabel = !feeBreakdown
    ? "Choose a route to preview picker appeal."
    : feeBreakdown.walkMinutes <= 6
      ? "High pickup appeal"
      : feeBreakdown.walkMinutes <= 11
        ? "Balanced route"
        : "Longer walk";

  useEffect(() => {
    setDropoffLocation(encodePinnedDropoff(pinCenter.lat, pinCenter.lng, pinnedLabel));
  }, [pinCenter, pinnedLabel]);

  useEffect(() => {
    if (diningHall && dropoffLocation) {
      setFeeBreakdown(calculateConvenienceFee(diningHall, dropoffLocation));
    } else {
      setFeeBreakdown(null);
    }
  }, [diningHall, dropoffLocation]);

  function updatePinCenter(nextCenter: Coordinate) {
    setPinCenter(clampCenter(nextCenter));
  }

  function recenterOnUser() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setError("Location services are not available in this browser.");
      return;
    }

    setError(null);
    setLocationStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = clampCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setUserLocation(nextCenter);
        setPinCenter(nextCenter);
        setLocationStatus("ready");
      },
      () => {
        setLocationStatus("denied");
        setError("We could not access your location. You can still drag the map to place your drop-off pin.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  function handleMapPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStateRef.current = {
      x: event.clientX,
      y: event.clientY,
      center: pinCenter,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMapPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const deltaX = event.clientX - dragStateRef.current.x;
    const deltaY = event.clientY - dragStateRef.current.y;

    updatePinCenter({
      lat: dragStateRef.current.center.lat + (deltaY / rect.height) * MAP_VIEW_SPAN.lat,
      lng: dragStateRef.current.center.lng - (deltaX / rect.width) * MAP_VIEW_SPAN.lng,
    });
  }

  function handleMapPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!feeBreakdown || !dropoffLocation) {
      setError("Please select a dining hall and confirm your drop-off pin.");
      return;
    }
    if (parsedMealCost < 0.01) {
      setError("Please enter an estimated meal cost.");
      return;
    }

    setLoading(true);

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        requester_id: userId,
        dining_hall: diningHall,
        items,
        dropoff_building: dropoffLocation,
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

    router.push(`/orders/${order.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-[#faf7ef] to-white border border-[#CFB991]/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8E6F3E]">
              Quick Start
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Tap a preset to prefill a common order and tweak from there.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ORDER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setItems(preset.items);
                  setNotes((current) => current || preset.notes);
                }}
                className="rounded-full border border-[#CFB991]/30 bg-white px-3 py-2 text-xs font-semibold text-[#8E6F3E] hover:border-[#CFB991] hover:bg-[#fffaf0] transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
          {DINING_HALLS.map((hall) => (
            <option key={hall.id} value={hall.id}>
              {hall.name}
            </option>
          ))}
        </select>
        {selectedDiningHall && (
          <p className="mt-2 text-xs text-gray-500">
            Best for routes starting at {selectedDiningHall.name}.
          </p>
        )}
      </div>

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
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>Be specific so the picker can move fast.</span>
          <span>{items.trim().length} chars</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Drop-off Location
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Keep the pin centered and drag the map underneath it, like DoorDash.
            </p>
          </div>
          <button
            type="button"
            onClick={recenterOnUser}
            className="rounded-full border border-[#CFB991]/30 bg-white px-3 py-2 text-xs font-semibold text-[#8E6F3E] hover:border-[#CFB991] hover:bg-[#fffaf0] transition-colors"
          >
            {locationStatus === "locating" ? "Finding you…" : "Use my location"}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div
            ref={mapRef}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={handleMapPointerUp}
            onPointerCancel={handleMapPointerUp}
            className="relative h-80 overflow-hidden rounded-[28px] border border-[#CFB991]/20 bg-[#f6f0df] touch-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(207,185,145,0.22) 0, rgba(207,185,145,0) 30%),
                radial-gradient(circle at 80% 15%, rgba(142,111,62,0.14) 0, rgba(142,111,62,0) 28%),
                linear-gradient(135deg, rgba(255,255,255,0.72), rgba(250,247,239,0.95)),
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
              `,
              backgroundSize: "auto, auto, auto, 32px 32px, 32px 32px",
            }}
          >
            <div className="absolute inset-0">
              {BUILDINGS.map((building) => {
                const position = getMarkerPosition({ lat: building.lat, lng: building.lng }, pinCenter);
                const isVisible =
                  position.left >= -8 &&
                  position.left <= 108 &&
                  position.top >= -8 &&
                  position.top <= 108;

                if (!isVisible) return null;

                return (
                  <div
                    key={building.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${position.left}%`, top: `${position.top}%` }}
                  >
                    <div
                      className={`rounded-full ring-4 ring-white/70 ${
                        building.isDiningHall ? "h-3.5 w-3.5 bg-[#8E6F3E]" : "h-2.5 w-2.5 bg-gray-700/70"
                      }`}
                    />
                    <p className="mt-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-gray-600 shadow-sm">
                      {building.name}
                    </p>
                  </div>
                );
              })}

              {userLocation && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${getMarkerPosition(userLocation, pinCenter).left}%`,
                    top: `${getMarkerPosition(userLocation, pinCenter).top}%`,
                  }}
                >
                  <div className="h-4 w-4 rounded-full border-2 border-white bg-sky-500 shadow-lg shadow-sky-500/30" />
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="relative flex flex-col items-center">
                <div className="h-11 w-11 rounded-full border-4 border-white bg-[#CFB991] shadow-xl shadow-black/15" />
                <div className="-mt-2 h-5 w-5 rotate-45 rounded-[4px] bg-[#CFB991] shadow-lg" />
                <div className="absolute top-3 h-3.5 w-3.5 rounded-full bg-white" />
              </div>
            </div>

            <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 rounded-full bg-white/80 px-4 py-2 backdrop-blur">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Center pin
              </span>
              <span className="text-xs font-medium text-gray-600">
                Drag to move
              </span>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E6F3E]">
                Pin Target
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {pinnedLabel}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {nearestBuilding ? `Nearest landmark: ${nearestBuilding.name}` : "Campus handoff point"}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                {formatCoordinate(pinCenter.lat)}, {formatCoordinate(pinCenter.lng)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updatePinCenter({ lat: pinCenter.lat + MAP_VIEW_SPAN.lat / 7, lng: pinCenter.lng })}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#CFB991]/40"
              >
                Move north
              </button>
              <button
                type="button"
                onClick={() => updatePinCenter({ lat: pinCenter.lat - MAP_VIEW_SPAN.lat / 7, lng: pinCenter.lng })}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#CFB991]/40"
              >
                Move south
              </button>
              <button
                type="button"
                onClick={() => updatePinCenter({ lat: pinCenter.lat, lng: pinCenter.lng - MAP_VIEW_SPAN.lng / 7 })}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#CFB991]/40"
              >
                Move west
              </button>
              <button
                type="button"
                onClick={() => updatePinCenter({ lat: pinCenter.lat, lng: pinCenter.lng + MAP_VIEW_SPAN.lng / 7 })}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#CFB991]/40"
              >
                Move east
              </button>
            </div>

            {!!nearbyLandmarks.length && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Nearby landmarks
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nearbyLandmarks.map((building) => (
                    <button
                      key={building.id}
                      type="button"
                      onClick={() => updatePinCenter({ lat: building.lat, lng: building.lng })}
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#CFB991]/40"
                    >
                      {building.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!!suggestedDropoffs.length && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Fast routes from {selectedDiningHall?.name ?? "your hall"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedDropoffs.map((building) => (
                    <button
                      key={building.id}
                      type="button"
                      onClick={() => updatePinCenter({ lat: building.lat, lng: building.lng })}
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#CFB991]/40"
                    >
                      {building.name} · {Math.round(building.walkMinutes)} min
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Room 205, call when here, meet by the front door"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
        />
      </div>

      {feeBreakdown && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800">Fee Estimate</p>
              <p className="text-xs text-gray-500 mt-1">
                {appealLabel} for pickers based on route length and fee.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8E6F3E] ring-1 ring-[#CFB991]/20">
              {Math.round(feeBreakdown.walkMinutes)} min walk
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Meal cost (your estimate)</span>
            <span>{formatCents(parsedMealCost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Base convenience fee</span>
            <span>{formatCents(feeBreakdown.baseFee)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Distance fee ({feeBreakdown.walkMinutes} min walk)</span>
            <span>{formatCents(feeBreakdown.distanceFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
            <span>Total charge</span>
            <span>{formatCents(totalCharge)}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile label="Route" value={selectedDiningHall ? selectedDiningHall.name : "Choose hall"} />
            <SummaryTile label="Drop-off" value={getDropoffLabel(dropoffLocation)} />
            <SummaryTile label="Picker earns" value={formatCents(feeBreakdown.totalFee)} />
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
