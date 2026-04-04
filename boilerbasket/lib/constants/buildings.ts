/**
 * Static lookup table of Purdue West Lafayette buildings.
 * Coordinates are approximate lat/lng centers.
 * Used for walking-distance convenience fee calculation.
 *
 * TODO: Expand this list; consider pulling from Purdue Maps API if one becomes available.
 */

export interface Building {
  id: string;          // slug used in DB
  name: string;        // display name
  lat: number;
  lng: number;
  isDiningHall: boolean;
}

export const BUILDINGS: Building[] = [
  // ── Dining Halls ─────────────────────────────────────────────────────────
  {
    id: "ford",
    name: "Ford Dining Court",
    lat: 40.4274,
    lng: -86.9094,
    isDiningHall: true,
  },
  {
    id: "wiley",
    name: "Wiley Dining Court",
    lat: 40.4259,
    lng: -86.9215,
    isDiningHall: true,
  },
  {
    id: "earhart",
    name: "Earhart Dining Court",
    lat: 40.4322,
    lng: -86.9196,
    isDiningHall: true,
  },
  {
    id: "hillenbrand",
    name: "Hillenbrand Dining Court",
    lat: 40.4195,
    lng: -86.9297,
    isDiningHall: true,
  },
  {
    id: "windsor",
    name: "Windsor Dining Court",
    lat: 40.4237,
    lng: -86.9250,
    isDiningHall: true,
  },
  {
    id: "mark",
    name: "1Bowl (Mark Hall)",
    lat: 40.4285,
    lng: -86.9145,
    isDiningHall: true,
  },

  // ── Academic / Drop-off Buildings ────────────────────────────────────────
  { id: "pmuw", name: "Purdue Memorial Union", lat: 40.4258, lng: -86.9098, isDiningHall: false },
  { id: "heavilon", name: "Heavilon Hall", lat: 40.4268, lng: -86.9121, isDiningHall: false },
  { id: "enad", name: "Engineering Administration (ENAD)", lat: 40.4276, lng: -86.9145, isDiningHall: false },
  { id: "phys", name: "Physics Building", lat: 40.4260, lng: -86.9133, isDiningHall: false },
  { id: "lwsn", name: "Lawson Computer Science (LWSN)", lat: 40.4284, lng: -86.9173, isDiningHall: false },
  { id: "haas", name: "Haas Hall", lat: 40.4290, lng: -86.9183, isDiningHall: false },
  { id: "msee", name: "MSEE", lat: 40.4279, lng: -86.9161, isDiningHall: false },
  { id: "brng", name: "Beering Hall (BRNG)", lat: 40.4249, lng: -86.9147, isDiningHall: false },
  { id: "krch", name: "Krannert (KRCH)", lat: 40.4243, lng: -86.9138, isDiningHall: false },
  { id: "lily", name: "Lilly Hall", lat: 40.4236, lng: -86.9158, isDiningHall: false },
  { id: "wthr", name: "Wetherill Lab (WTHR)", lat: 40.4267, lng: -86.9154, isDiningHall: false },
  { id: "sc",   name: "Stewart Center", lat: 40.4255, lng: -86.9107, isDiningHall: false },
  { id: "me",   name: "Mechanical Engineering Building", lat: 40.4282, lng: -86.9130, isDiningHall: false },
  { id: "stew", name: "Third Street Suites", lat: 40.4230, lng: -86.9215, isDiningHall: false },
  { id: "shrv", name: "Shreve Residence Hall", lat: 40.4261, lng: -86.9235, isDiningHall: false },
  { id: "hamp", name: "Harrison Hall", lat: 40.4271, lng: -86.9244, isDiningHall: false },
  { id: "cary", name: "Cary Quadrangle", lat: 40.4256, lng: -86.9218, isDiningHall: false },
  { id: "mthw", name: "Matthews Hall", lat: 40.4244, lng: -86.9225, isDiningHall: false },
  { id: "vill", name: "Hillenbrand Hall", lat: 40.4196, lng: -86.9293, isDiningHall: false },
];

export const DINING_HALLS = BUILDINGS.filter((b) => b.isDiningHall);
export const DROP_OFF_BUILDINGS = BUILDINGS.filter((b) => !b.isDiningHall);

export function getBuildingById(id: string): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
