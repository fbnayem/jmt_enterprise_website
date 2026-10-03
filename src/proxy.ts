import { NextResponse, type NextRequest } from "next/server";

/**
 * Staging gate: when STAGING_PASSWORD is set, every page asks for a browser
 * login (any username, that password). Cron and email webhooks keep their own
 * auth so they still work behind the gate. Leave it unset on the live site.
 */
const password = process.env.STAGING_PASSWORD;

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorised(header: string | null) {
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    return safeEqual(supplied, password!);
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (!password || authorised(request.headers.get("authorization"))) return NextResponse.next();
  return new NextResponse("This preview is private.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="JMT Enterprise preview", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow" },
  });
}

export const config = {
  matcher: ["/((?!api/cron|api/webhooks|_next/static).*)"],
};
