/**
 * DEVELOPMENT ADAPTER endpoint: stands in for the private storage bucket's
 * signed upload/read URLs. Disabled whenever Supabase is configured.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { PHOTO_LIMITS } from "@/lib/quote/options";
import { assertDevAdaptersAllowed, usingSupabase } from "@/lib/server/config";
import { safeKeyPath, verifyDevUrl } from "@/lib/server/dev/dev-storage";

function authorize(request: Request, op: "put" | "get") {
  if (usingSupabase()) return null;
  assertDevAdaptersAllowed("Photo storage");
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const ok = verifyDevUrl(op, key, Number(url.searchParams.get("expires")), url.searchParams.get("sig") ?? "");
  return ok ? key : null;
}

export async function PUT(request: Request) {
  const key = authorize(request, "put");
  if (!key || !key.startsWith("incoming/")) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length > PHOTO_LIMITS.maxBytesEach) return NextResponse.json({ error: "Too large" }, { status: 413 });
  const p = safeKeyPath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, buf);
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const key = authorize(request, "get");
  if (!key) return NextResponse.json({ error: "Link expired or invalid" }, { status: 403 });
  try {
    const data = await fs.readFile(safeKeyPath(key));
    return new NextResponse(new Uint8Array(data), {
      headers: { "content-type": "image/jpeg", "cache-control": "private, no-store", "x-robots-tag": "noindex" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
