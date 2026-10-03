/**
 * Cloudflare Turnstile verification. Switched off until TURNSTILE_SECRET_KEY
 * (and NEXT_PUBLIC_TURNSTILE_SITE_KEY for the browser widget) are set.
 */
import { serverConfig } from "./config";

export const turnstileEnabled = () => Boolean(serverConfig.turnstileSecretKey);

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret: serverConfig.turnstileSecretKey, response: token });
    if (ip && ip !== "unknown") form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("[turnstile] verification failed:", e instanceof Error ? e.message : e);
    return false;
  }
}
