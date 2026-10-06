import { business } from "@/content/site";
import {
  ELEVATOR,
  STAIRS,
  YES_NO_UNSURE,
  labelOf,
  serviceTypeLabel,
  timeWindowLabel,
  vehicleLabel,
} from "@/lib/quote/options";
import type { Access, Address, Item } from "@/lib/quote/schema";
import { formatIsoDate } from "@/lib/quote/time";
import { serverConfig } from "./config";
import type { StoredQuoteRequest } from "./types";

/** Hosted logo for emails. Fixed width/height keep the layout when images are blocked. */
const logoImg = () =>
  `<img src="${serverConfig.siteUrl.replace(/\/$/, "")}/brand/jmt-logo-email.png" width="180" height="122" alt="${business.name}" style="display:block;border:0;margin:0 0 20px;height:122px;width:180px">`;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const addressLine = (a: Address) => `${a.street}${a.unit ? `, ${a.unit}` : ""}, ${a.city}, ${a.state} ${a.zip}`;

const accessLine = (a: Access) =>
  [
    labelOf(STAIRS, a.stairs),
    a.floor ? `floor ${a.floor}` : "",
    labelOf(ELEVATOR, a.elevator),
    a.parkingNotes ? `Parking/access: ${a.parkingNotes}` : "",
  ]
    .filter(Boolean)
    .join("; ");

const itemLine = (i: Item) => {
  const dims =
    i.sizeKnown === "yes" && (i.length || i.width || i.height)
      ? `${i.length || "?"} × ${i.width || "?"} × ${i.height || "?"} ${i.dimensionUnit}`
      : "size not sure";
  const weight = i.sizeKnown === "yes" && i.weight ? `${i.weight} ${i.weightUnit}` : "weight not sure";
  const flags = [i.fragile ? "FRAGILE" : "", i.oversized ? "OVERSIZED" : ""].filter(Boolean).join(", ");
  return `${i.quantity} × ${i.description} (${dims}; ${weight})${flags ? ` [${flags}]` : ""}`;
};

export const timingLine = (r: StoredQuoteRequest["request"], timezone: string) =>
  `${r.dateMode === "asap" ? "As soon as possible" : formatIsoDate(r.requestedDate)}, ${timeWindowLabel(r.timeWindow)} (requested; timezone ${timezone})`;

export function internalEmail(req: StoredQuoteRequest, photoLinks: { name: string; url: string }[]) {
  const r = req.request;
  const subject = `New JMT quote request ${req.reference} — ${serviceTypeLabel(r.serviceType)}`;

  const rows: [string, string][] = [
    ["Reference", req.reference],
    ["Received", new Date(req.createdAt).toLocaleString("en-US", { timeZone: req.timezone }) + ` (${req.timezone})`],
    ["Name", r.name],
    ["Phone", r.phone],
    ["Email", r.email],
    ["Preferred contact", r.preferredContact],
    ["Customer type", r.customerType === "business" ? "Business" : "Individual"],
    ["Company", r.companyName || "—"],
    ["Service", serviceTypeLabel(r.serviceType)],
    ["Requested timing", timingLine(r, req.timezone)],
    ["Pickup", addressLine(r.pickup)],
    ["Pickup access", accessLine(r.pickupAccess)],
    ...r.extraStops.map(
      (s, i) =>
        [`Extra stop ${i + 1} (${s.kind === "pickup" ? "pickup" : "drop-off"})`, addressLine(s.address) + (s.notes ? ` — ${s.notes}` : "")] as [string, string],
    ),
    ["Drop-off", addressLine(r.dropoff)],
    ["Drop-off access", accessLine(r.dropoffAccess)],
    ["Items", r.items.map(itemLine).join("\n")],
    ["Vehicle preference", vehicleLabel(r.vehicle)],
    ["Loading help needed", labelOf(YES_NO_UNSURE, r.loadingHelp)],
    ["Special instructions", r.specialInstructions || "—"],
    ["Photo notes", r.photoNotes || "—"],
    ["Photos", photoLinks.length ? `${photoLinks.length} attached (links below)` : "None"],
  ];

  const linkTtlDays = 7;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a">
${logoImg()}
<h2 style="margin:0 0 4px">New quote request ${esc(req.reference)}</h2>
<p style="margin:0 0 16px;color:#475569">Awaiting JMT review. Reply to this email to contact the customer directly.</p>
<table cellpadding="6" style="border-collapse:collapse;font-size:14px">
${rows
  .map(
    ([k, v]) =>
      `<tr><th align="left" valign="top" style="border-bottom:1px solid #e2e8f0;white-space:nowrap">${esc(k)}</th><td style="border-bottom:1px solid #e2e8f0;white-space:pre-wrap">${esc(v)}</td></tr>`,
  )
  .join("\n")}
</table>
${
  photoLinks.length
    ? `<h3>Photos</h3><ul>${photoLinks.map((p) => `<li><a href="${esc(p.url)}">${esc(p.name)}</a></li>`).join("")}</ul>
<p style="color:#64748b;font-size:12px">Photo links are private and expire after about ${linkTtlDays} days. Renew them with <code>npm run ops -- photo-links ${esc(req.reference)}</code>.</p>`
    : ""
}
</body></html>`;

  const text = [
    `New quote request ${req.reference}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(photoLinks.length ? ["", "Photos:", ...photoLinks.map((p) => `${p.name}: ${p.url}`)] : []),
  ].join("\n");

  return { subject, html, text };
}

export function customerReceiptEmail(req: StoredQuoteRequest) {
  const r = req.request;
  const subject = `We received your quote request ${req.reference}`;
  const intro = `Thank you. Your quote request has been received. Your reference is ${req.reference}. ${business.shortName} will review your details and contact you with a quote and availability. Your pickup or delivery is confirmed only after JMT agrees the service with you.`;
  const summary: [string, string][] = [
    ["Service", serviceTypeLabel(r.serviceType)],
    ["Requested timing", timingLine(r, req.timezone)],
    ["Pickup", `${r.pickup.city}, ${r.pickup.state}`],
    ["Drop-off", `${r.dropoff.city}, ${r.dropoff.state}`],
    ["Items", r.items.map((i) => `${i.quantity} × ${i.description}`).join(", ")],
  ];

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
${logoImg()}
<h2 style="margin:0 0 12px">Your request has been received</h2>
<p>Hi ${esc(r.name)},</p>
<p>${esc(intro)}</p>
<table cellpadding="6" style="border-collapse:collapse;font-size:14px">
${summary.map(([k, v]) => `<tr><th align="left" valign="top">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("\n")}
</table>
<p>Need to add something or change a detail? Reply to this email or call <a href="${business.phoneHref}">${business.phoneDisplay}</a> and mention your reference.</p>
<p>${esc(business.name)}<br><a href="${business.url}">${business.url.replace("https://", "")}</a></p>
</body></html>`;

  const text = [
    `Hi ${r.name},`,
    "",
    intro,
    "",
    ...summary.map(([k, v]) => `${k}: ${v}`),
    "",
    `Need to add something or change a detail? Reply to this email or call ${business.phoneDisplay} and mention your reference.`,
    "",
    business.name,
    business.url,
  ].join("\n");

  return { subject, html, text };
}
