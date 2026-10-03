import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const ga = Boolean(process.env.NEXT_PUBLIC_GA4_ID);
const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const supabaseOrigin = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : "";
  } catch {
    return "";
  }
})();

/**
 * Content Security Policy. Next.js streams its page data in inline scripts on
 * statically rendered pages, so script-src keeps 'unsafe-inline' (a nonce
 * would force every page to render dynamically). Everything else is locked
 * to this site plus the services the app actually calls.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${ga ? " https://www.googletagmanager.com" : ""}${turnstile ? " https://challenges.cloudflare.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${ga ? " https://www.google-analytics.com https://www.googletagmanager.com" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${ga ? " https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com" : ""}${isDev ? " ws:" : ""}`,
  `frame-src ${turnstile ? "https://challenges.cloudflare.com" : "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
