import crypto from "node:crypto";
import { ACKNOWLEDGEMENT_VERSION } from "@/lib/quote/options";
import { issueDraftToken } from "@/lib/server/draft-token";

export const address = (city = "Springfield") => ({ street: "100 Main St", unit: "", city, state: "CO", zip: "80202" });
export const access = (over = {}) => ({ stairs: "not-sure", floor: "", elevator: "not-sure", parkingNotes: "", ...over });
export const item = (over = {}) => ({
  description: "3-seat sofa",
  quantity: "1",
  sizeKnown: "not-sure",
  length: "",
  width: "",
  height: "",
  dimensionUnit: "in",
  weight: "",
  weightUnit: "lb",
  fragile: false,
  oversized: false,
  ...over,
});

export function validPayload(over: Record<string, unknown> = {}, draft = issueDraftToken(Date.now() - 10_000)) {
  return {
    serviceType: "marketplace-pickup",
    customerType: "individual",
    companyName: "",
    pickup: address("Denver"),
    dropoff: address("Aurora"),
    extraStops: [],
    dateMode: "asap",
    requestedDate: "",
    timeWindow: "flexible",
    items: [item()],
    vehicle: "not-sure",
    loadingHelp: "not-sure",
    pickupAccess: access({ stairs: "some", floor: "3", elevator: "no" }),
    dropoffAccess: access(),
    specialInstructions: "",
    attachmentIds: [],
    photoNotes: "",
    name: "Test Customer",
    phone: "(720) 555-0100",
    email: "Customer@Example.com",
    preferredContact: "either",
    acknowledged: true,
    meta: { idempotencyKey: crypto.randomUUID(), draftToken: draft.token, website: "", acknowledgementVersion: ACKNOWLEDGEMENT_VERSION, source: {} },
    ...over,
  };
}
