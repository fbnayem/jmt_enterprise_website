"use client";

/**
 * Privacy-safe analytics. Only these event names and these parameter keys can
 * be sent, and parameter values are short enum-like strings or numbers. Never
 * pass names, emails, phone numbers, addresses, photos or free text.
 */
type EventName =
  | "quote_form_start"
  | "quote_step_complete"
  | "quote_submit_success"
  | "phone_click"
  | "email_click"
  | "quote_cta_click";

type SafeParams = { step?: number; service_type?: string; customer_type?: string; location?: string };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: EventName, params: SafeParams = {}) {
  if (typeof window === "undefined") return;
  const safe: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "number" || (typeof v === "string" && /^[a-z0-9_-]{1,40}$/i.test(v))) safe[k] = v;
  }
  if (window.gtag) window.gtag("event", event, safe);
  else (window.dataLayer ??= []).push({ event, ...safe });
}
