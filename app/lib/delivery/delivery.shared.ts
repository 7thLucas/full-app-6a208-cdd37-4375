/**
 * Shared delivery-domain constants & types.
 * Safe for both client and server (no server-only imports).
 */

export type AppRole = "customer" | "courier" | "admin";

export const DELIVERY_STATUSES = [
  "Pending",
  "Searching for Courier",
  "Courier Assigned",
  "Courier En Route to Pickup",
  "Package Picked Up",
  "In Transit",
  "Arriving Soon",
  "Delivered",
  "Cancelled",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/**
 * The ordered forward progression a courier moves a job through.
 * "Cancelled" is a terminal exit available before Delivered and is not in this list.
 */
export const FORWARD_STATUS_FLOW: DeliveryStatus[] = [
  "Searching for Courier",
  "Courier Assigned",
  "Courier En Route to Pickup",
  "Package Picked Up",
  "In Transit",
  "Arriving Soon",
  "Delivered",
];

/** The next status a courier advances a job to, given the current one. */
export function nextStatus(current: DeliveryStatus): DeliveryStatus | null {
  const idx = FORWARD_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= FORWARD_STATUS_FLOW.length - 1) return null;
  return FORWARD_STATUS_FLOW[idx + 1];
}

export function isTerminalStatus(s: DeliveryStatus): boolean {
  return s === "Delivered" || s === "Cancelled";
}

export function isActiveStatus(s: DeliveryStatus): boolean {
  return !isTerminalStatus(s) && s !== "Pending";
}

/** UI grouping for status pills. */
export function statusTone(
  s: DeliveryStatus,
): "muted" | "secondary" | "accent" | "success" | "destructive" {
  switch (s) {
    case "Pending":
    case "Searching for Courier":
      return "muted";
    case "Delivered":
      return "success";
    case "Cancelled":
      return "destructive";
    case "Courier Assigned":
      return "secondary";
    default:
      return "secondary";
  }
}

export const PACKAGE_SIZES = ["Small", "Medium", "Large", "Extra Large"] as const;
export type PackageSize = (typeof PACKAGE_SIZES)[number];

export const PACKAGE_CATEGORIES = [
  "Documents",
  "Food",
  "Electronics",
  "Clothing",
  "Fragile",
  "Groceries",
  "Other",
] as const;
export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number];

export const VEHICLE_TYPES = [
  "Bicycle",
  "Motorcycle",
  "Car",
  "Van",
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** Size-based multiplier applied to the per-distance fare. */
export const SIZE_MULTIPLIER: Record<PackageSize, number> = {
  Small: 1,
  Medium: 1.25,
  Large: 1.6,
  "Extra Large": 2.1,
};

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Haversine distance in kilometers between two coordinates. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface PricingRules {
  baseFare: number;
  perKmRate: number;
  currencySymbol: string;
}

export const DEFAULT_PRICING: PricingRules = {
  baseFare: 3.5,
  perKmRate: 1.2,
  currencySymbol: "$",
};

/** Estimate the price for a delivery given distance, size and rules. */
export function estimatePrice(
  distanceKm: number,
  size: PackageSize,
  rules: PricingRules,
): number {
  const multiplier = SIZE_MULTIPLIER[size] ?? 1;
  const raw = rules.baseFare + distanceKm * rules.perKmRate * multiplier;
  return Math.round(raw * 100) / 100;
}

export function formatMoney(amount: number, symbol = "$"): string {
  return `${symbol}${amount.toFixed(2)}`;
}
