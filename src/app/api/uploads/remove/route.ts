import { NextResponse } from "next/server";
import { removeUpload } from "@/lib/server/uploads";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await removeUpload(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
