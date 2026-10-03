/**
 * Shared validation for the quote request. The browser uses the step schemas
 * for inline errors; the server re-validates the complete payload with
 * `quoteRequestSchema` and never trusts the client's result.
 */
import { z } from "zod";
import { business } from "@/content/site";
import {
  ACKNOWLEDGEMENT_VERSION,
  ELEVATOR,
  MAX_EXTRA_STOPS,
  MAX_ITEMS,
  PHOTO_LIMITS,
  SERVICE_TYPES,
  STAIRS,
  TIME_WINDOWS,
  US_STATES,
  VEHICLE_PREFS,
  YES_NO_UNSURE,
} from "./options";
import { isPastDate, isValidIsoDate } from "./time";

const keys = <T extends readonly { key: string }[]>(list: T) =>
  list.map((o) => o.key) as unknown as [T[number]["key"], ...T[number]["key"][]];

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);
const required = (max: number, message: string) => text(max).min(1, message);
const optionalNumber = z
  .string()
  .trim()
  .regex(/^(\d{1,5}(\.\d{1,2})?)?$/, "Enter a number, or leave blank if not sure.");

export const addressSchema = z.object({
  street: required(200, "Enter the street address."),
  unit: text(60),
  city: required(100, "Enter the city."),
  state: z.enum(US_STATES, { error: "Choose a state." }),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code."),
});

export const accessSchema = z.object({
  stairs: z.enum(keys(STAIRS), { error: "Tell us about stairs, or choose Not sure." }),
  floor: optionalNumber,
  elevator: z.enum(keys(ELEVATOR), { error: "Tell us about elevator access, or choose Not sure." }),
  parkingNotes: text(500),
});

export const extraStopSchema = z.object({
  kind: z.enum(["pickup", "dropoff"]),
  address: addressSchema,
  notes: text(300),
});

export const itemSchema = z.object({
  description: required(300, "Describe the item."),
  quantity: z
    .string()
    .trim()
    .regex(/^[1-9]\d{0,2}$/, "Enter a quantity from 1 to 999."),
  sizeKnown: z.enum(["yes", "not-sure"]),
  length: optionalNumber,
  width: optionalNumber,
  height: optionalNumber,
  dimensionUnit: z.enum(["in", "ft", "cm"]),
  weight: optionalNumber,
  weightUnit: z.enum(["lb", "kg"]),
  fragile: z.boolean(),
  oversized: z.boolean(),
});

export const step1Schema = z
  .object({
    serviceType: z.enum(SERVICE_TYPES, { error: "Choose a service." }),
    customerType: z.enum(["individual", "business"], { error: "Choose Individual or Business." }),
    companyName: text(150),
    pickup: addressSchema,
    dropoff: addressSchema,
    extraStops: z.array(extraStopSchema).max(MAX_EXTRA_STOPS),
    dateMode: z.enum(["asap", "date"], { error: "Choose a preferred date or As soon as possible." }),
    requestedDate: z.string().trim(),
    timeWindow: z.enum(keys(TIME_WINDOWS), { error: "Choose a time window or Flexible." }),
  })
  .superRefine((v, ctx) => {
    if (v.dateMode !== "date") return;
    if (!isValidIsoDate(v.requestedDate)) {
      ctx.addIssue({ code: "custom", path: ["requestedDate"], message: "Choose a preferred date." });
    } else if (isPastDate(v.requestedDate, business.timezone)) {
      ctx.addIssue({ code: "custom", path: ["requestedDate"], message: "Choose today or a future date." });
    }
  });

export const step2Schema = z.object({
  items: z.array(itemSchema).min(1, "Add at least one item.").max(MAX_ITEMS),
  vehicle: z.enum(VEHICLE_PREFS, { error: "Choose a vehicle, or Not sure." }),
  loadingHelp: z.enum(keys(YES_NO_UNSURE), { error: "Tell us if you need loading help, or choose Not sure." }),
  pickupAccess: accessSchema,
  dropoffAccess: accessSchema,
  specialInstructions: text(2000),
});

export const step3Schema = z.object({
  attachmentIds: z.array(z.uuid()).max(PHOTO_LIMITS.maxFiles, `You can add up to ${PHOTO_LIMITS.maxFiles} photos.`),
  photoNotes: text(1000),
});

export const step4Schema = z.object({
  name: required(120, "Enter your name."),
  phone: z
    .string()
    .trim()
    .refine((v) => /^(\+?1)?\d{10}$/.test(v.replace(/[\s().-]/g, "")), "Enter a 10-digit US phone number."),
  email: z.email("Enter a valid email address.").max(254),
  preferredContact: z.enum(["phone", "email", "either"]),
  acknowledged: z.literal(true, { error: "Please confirm you understand this is a request, not a booking." }),
});

export const metaSchema = z.object({
  idempotencyKey: z.uuid(),
  draftToken: z.string().min(10).max(500),
  /** Honeypot. Real visitors never see or fill this field. */
  website: z.string().max(500).optional().default(""),
  acknowledgementVersion: z.literal(ACKNOWLEDGEMENT_VERSION),
  source: z
    .object({
      landingPath: text(300),
      referrerHost: text(200),
      utmSource: text(100),
      utmMedium: text(100),
      utmCampaign: text(100),
    })
    .partial()
    .optional()
    .default({}),
});

export const quoteRequestSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  meta: metaSchema,
}).superRefine((v, ctx) => {
  // Re-run step 1's cross-field date rule on the merged object.
  const r = step1Schema.safeParse(v);
  if (!r.success) for (const issue of r.error.issues) if (issue.code === "custom") ctx.addIssue({ ...issue, code: "custom" });
});

export type QuoteRequestInput = z.input<typeof quoteRequestSchema>;
export type QuoteRequest = z.output<typeof quoteRequestSchema>;
export type Address = z.output<typeof addressSchema>;
export type Item = z.output<typeof itemSchema>;
export type Access = z.output<typeof accessSchema>;

export const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema] as const;

/** Flattens zod issues to `{ "pickup.city": "Enter the city." }` for inline display. */
export function issuesToErrors(issues: readonly z.core.$ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.join(".");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return `${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
}
