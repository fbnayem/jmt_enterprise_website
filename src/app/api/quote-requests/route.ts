import { after, NextResponse } from "next/server";
import { processOutbox } from "@/lib/server/outbox";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { submitQuoteRequest } from "@/lib/server/submit";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!(await rateLimit(`submit:${clientIp(request.headers)}`, 8, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes or call us." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const outcome = await submitQuoteRequest(body, new Date(), clientIp(request.headers));
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error, code: outcome.code, fieldErrors: outcome.fieldErrors }, { status: outcome.status });
  }
  if (!outcome.duplicate && !outcome.suspectedSpam) {
    // Best-effort immediate send. The jobs are already saved, so the scheduled
    // worker (/api/cron/notifications) delivers them if this does not finish.
    const requestId = outcome.requestId;
    after(() => processOutbox({ requestId }).catch((e) => console.error("[outbox] immediate send failed:", e?.message)));
  }
  return NextResponse.json({ reference: outcome.reference }, { status: outcome.duplicate ? 200 : 201 });
}
