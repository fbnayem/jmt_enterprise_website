import { NextResponse } from "next/server";
import { completeUpload } from "@/lib/server/uploads";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const result = await completeUpload(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[uploads] complete failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The photo could not be saved. Please retry." }, { status: 500 });
  }
}
