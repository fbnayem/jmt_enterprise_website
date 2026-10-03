import { services, vehicles } from "@/content/site";

export const SERVICE_TYPES = [...services.map((s) => s.key), "not-sure"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const serviceTypeLabel = (key: string): string =>
  key === "not-sure" ? "Not sure / something else" : (services.find((s) => s.key === key)?.title ?? key);

export const VEHICLE_PREFS = [...vehicles.map((v) => v.key), "not-sure"] as const;
export type VehiclePref = (typeof VEHICLE_PREFS)[number];
export const vehicleLabel = (key: string): string =>
  key === "not-sure" ? "Not sure" : (vehicles.find((v) => v.key === key)?.title ?? key);

export const TIME_WINDOWS = [
  { key: "flexible", label: "Flexible" },
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number]["key"];
export const timeWindowLabel = (key: string) => TIME_WINDOWS.find((t) => t.key === key)?.label ?? key;

export const YES_NO_UNSURE = [
  { key: "yes", label: "Yes" },
  { key: "no", label: "No" },
  { key: "not-sure", label: "Not sure" },
] as const;

export const STAIRS = [
  { key: "none", label: "No stairs" },
  { key: "some", label: "Yes, stairs" },
  { key: "not-sure", label: "Not sure" },
] as const;

export const ELEVATOR = [
  { key: "yes", label: "Elevator available" },
  { key: "no", label: "No elevator" },
  { key: "na", label: "Not needed (ground level)" },
  { key: "not-sure", label: "Not sure" },
] as const;

export const labelOf = (list: readonly { key: string; label: string }[], key: string | undefined) =>
  list.find((o) => o.key === key)?.label ?? key ?? "";

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export const PHOTO_LIMITS = {
  maxFiles: 5,
  maxBytesEach: 10 * 1024 * 1024,
  maxBytesTotal: 50 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptAttr: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  maxPixels: 50_000_000,
  maxSide: 12_000,
} as const;

export const MAX_ITEMS = 20;
export const MAX_EXTRA_STOPS = 3;

/** Bump when the acknowledgement wording on the review step changes. */
export const ACKNOWLEDGEMENT_VERSION = "2026-10-03.v1";
export const ACKNOWLEDGEMENT_TEXT =
  "I understand this is a quote request. My pickup or delivery is confirmed only after JMT Enterprise reviews my request and agrees the service with me.";
