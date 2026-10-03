import { describe, expect, it } from "vitest";
import { business } from "@/content/site";
import { issuesToErrors, quoteRequestSchema, step1Schema } from "@/lib/quote/schema";
import { isPastDate, todayInTimezone } from "@/lib/quote/time";
import { validPayload } from "./helpers";

const errorsOf = (p: unknown) => {
  const r = quoteRequestSchema.safeParse(p);
  return r.success ? {} : issuesToErrors(r.error.issues);
};

describe("quote request validation", () => {
  it("accepts a complete request where the customer is unsure of vehicle, weight and access", () => {
    expect(quoteRequestSchema.safeParse(validPayload()).success).toBe(true);
  });

  it("reports every missing required field by path", () => {
    const errs = errorsOf(validPayload({ serviceType: "", pickup: { street: "", unit: "", city: "", state: "", zip: "" }, name: "", acknowledged: false }));
    expect(Object.keys(errs)).toEqual(expect.arrayContaining(["serviceType", "pickup.street", "pickup.city", "pickup.state", "pickup.zip", "name", "acknowledged"]));
  });

  it("rejects an invalid email and phone", () => {
    const errs = errorsOf(validPayload({ email: "not-an-email", phone: "12345" }));
    expect(errs.email).toBeDefined();
    expect(errs.phone).toBeDefined();
  });

  it("requires access answers but allows Not sure", () => {
    expect(errorsOf(validPayload({ dropoffAccess: { stairs: "", floor: "", elevator: "", parkingNotes: "" } }))["dropoffAccess.stairs"]).toBeDefined();
  });

  it("rejects dates in the past in the service timezone and accepts today", () => {
    const today = todayInTimezone(business.timezone);
    const ok = step1Schema.safeParse({ ...validPayload(), dateMode: "date", requestedDate: today });
    expect(ok.success).toBe(true);
    const past = errorsOf(validPayload({ dateMode: "date", requestedDate: "2020-01-01" }));
    expect(past.requestedDate).toMatch(/today or a future date/);
    expect(errorsOf(validPayload({ dateMode: "date", requestedDate: "2026-02-30" })).requestedDate).toBeDefined();
  });

  it("computes 'today' in the business timezone, not UTC", () => {
    // 03:00 UTC on Oct 4 is still Oct 3 in Denver (UTC-6).
    const now = new Date("2026-10-04T03:00:00Z");
    expect(todayInTimezone("America/Denver", now)).toBe("2026-10-03");
    expect(isPastDate("2026-10-03", "America/Denver", now)).toBe(false);
    expect(isPastDate("2026-10-02", "America/Denver", now)).toBe(true);
  });

  it("supports multiple items with dimensions and extra stops", () => {
    const r = quoteRequestSchema.safeParse(
      validPayload({
        items: [
          { description: "Armoire", quantity: "1", sizeKnown: "yes", length: "72", width: "40", height: "24", dimensionUnit: "in", weight: "250", weightUnit: "lb", fragile: true, oversized: true },
          { description: "Boxes", quantity: "6", sizeKnown: "not-sure", length: "", width: "", height: "", dimensionUnit: "in", weight: "", weightUnit: "lb", fragile: false, oversized: false },
        ],
        extraStops: [{ kind: "pickup", address: { street: "5 Oak Ave", unit: "", city: "Lakewood", state: "CO", zip: "80226" }, notes: "Side door" }],
      }),
    );
    expect(r.success).toBe(true);
  });
});
