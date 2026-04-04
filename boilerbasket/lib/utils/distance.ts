import { getBuildingById } from "@/lib/constants/buildings";
import { getDropoffCoordinates } from "@/lib/utils/dropoff";

/**
 * Haversine formula — returns straight-line distance in meters between two lat/lng points.
 * For on-campus walking estimates this is close enough without a routing API.
 */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimates walking time in minutes between two campus buildings.
 * Assumes ~80 m/min average walking speed on campus paths.
 *
 * TODO: Replace with a proper walking-route API (e.g. Google Maps Directions,
 * OpenRouteService) for more accurate path distance vs. straight-line.
 */
export function estimatedWalkMinutes(
  diningHallId: string,
  dropoffLocation: string
): number {
  const origin = getBuildingById(diningHallId);
  const destination = getDropoffCoordinates(dropoffLocation);

  if (!origin || !destination) return 0;

  const meters = haversineMeters(
    origin.lat, origin.lng,
    destination.lat, destination.lng
  );

  const WALKING_SPEED_M_PER_MIN = 80;
  return meters / WALKING_SPEED_M_PER_MIN;
}
