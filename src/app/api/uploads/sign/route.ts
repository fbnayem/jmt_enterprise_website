import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { signUpload } from "@/lib/server/uploads";

export async function POST(request: Request) {
  if (!rateLimit(`upload:${clientIp(request.headers)}`, 40, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await signUpload(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
