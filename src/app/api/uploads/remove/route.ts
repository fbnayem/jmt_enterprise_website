import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { removeUpload } from "@/lib/server/uploads";

export async function POST(request: Request) {
  if (!(await rateLimit(`upload-remove:${clientIp(request.headers)}`, 60, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await removeUpload(body);
  if (!result.ok) return NextResponse.json({ error: result.error, code: "code" in result ? result.code : undefined }, { status: result.status });
  return NextResponse.json(result);
}
