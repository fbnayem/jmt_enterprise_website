import { NextResponse } from "next/server";
import { issueDraftToken } from "@/lib/server/draft-token";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

/** Starts an anonymous form session used to scope photo uploads. */
export async function POST(request: Request) {
  if (!rateLimit(`draft:${clientIp(request.headers)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }
  const { token } = issueDraftToken();
  return NextResponse.json({ token }, { headers: { "cache-control": "no-store" } });
}
