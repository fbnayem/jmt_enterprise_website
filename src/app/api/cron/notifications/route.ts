import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/server/config";
import { cleanupAbandonedUploads, processOutbox } from "@/lib/server/outbox";

export const maxDuration = 60;

/** Scheduled worker: sends due notifications and removes abandoned uploads. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!serverConfig.cronSecret || auth !== `Bearer ${serverConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await processOutbox({ limit: 50 });
  const removedUploads = await cleanupAbandonedUploads();
  return NextResponse.json({ processed: results.length, results, removedUploads });
}
