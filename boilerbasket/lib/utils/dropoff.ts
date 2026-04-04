import { BUILDINGS, getBuildingById, type Building } from "@/lib/constants/buildings";

const PIN_PREFIX = "pin:";

export interface PinnedDropoff {
  kind: "pin";
  lat: number;
  lng: number;
  label: string;
}

export interface BuildingDropoff {
  kind: "building";
  id: string;
  building: Building;
}

export type ResolvedDropoff = PinnedDropoff | BuildingDropoff;

export function encodePinnedDropoff(lat: number, lng: number, label: string) {
  return `${PIN_PREFIX}${lat.toFixed(6)},${lng.toFixed(6)}:${encodeURIComponent(label)}`;
}

export function parsePinnedDropoff(value: string): PinnedDropoff | null {
  if (!value.startsWith(PIN_PREFIX)) return null;

  const payload = value.slice(PIN_PREFIX.length);
  const separatorIndex = payload.indexOf(":");
  if (separatorIndex === -1) return null;

  const coordinatePart = payload.slice(0, separatorIndex);
  const labelPart = payload.slice(separatorIndex + 1);
  const [latText, lngText] = coordinatePart.split(",");
  const lat = Number.parseFloat(latText);
  const lng = Number.parseFloat(lngText);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    kind: "pin",
    lat,
    lng,
    label: decodeURIComponent(labelPart || "Pinned drop-off"),
  };
}

export function resolveDropoff(value: string): ResolvedDropoff | null {
  const building = getBuildingById(value);
  if (building) {
    return {
      kind: "building",
      id: value,
      building,
    };
  }

  return parsePinnedDropoff(value);
}

export function getDropoffCoordinates(value: string) {
  const resolved = resolveDropoff(value);

  if (!resolved) return null;
  if (resolved.kind === "building") {
    return {
      lat: resolved.building.lat,
      lng: resolved.building.lng,
    };
  }

  return {
    lat: resolved.lat,
    lng: resolved.lng,
  };
}

export function findNearestBuilding(lat: number, lng: number) {
  let nearest: Building | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const building of BUILDINGS) {
    const distance = Math.hypot(building.lat - lat, building.lng - lng);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = building;
    }
  }

  return nearest;
}

export function getDropoffLabel(value: string) {
  const resolved = resolveDropoff(value);

  if (!resolved) return value;
  if (resolved.kind === "building") return resolved.building.name;
  return resolved.label;
}

export function getPinnedDropoffSummary(lat: number, lng: number) {
  const nearestBuilding = findNearestBuilding(lat, lng);
  if (!nearestBuilding) return "Pinned drop-off";

  return `Pin near ${nearestBuilding.name}`;
}
