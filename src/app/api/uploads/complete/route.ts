import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { completeUpload } from "@/lib/server/uploads";

export async function POST(request: Request) {
  if (!(await rateLimit(`upload-complete:${clientIp(request.headers)}`, 60, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    const result = await completeUpload(body);
    if (!result.ok) return NextResponse.json({ error: result.error, code: "code" in result ? result.code : undefined }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[uploads] complete failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The photo could not be saved. Please retry." }, { status: 500 });
  }
}
