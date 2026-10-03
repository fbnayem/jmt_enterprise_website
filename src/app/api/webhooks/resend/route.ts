import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/server/config";
import { handleResendEvent, verifySvixSignature } from "@/lib/server/resend-webhook";

/** Delivery, delay, bounce and failure events from Resend. */
export async function POST(request: Request) {
  const body = await request.text();
  const valid = verifySvixSignature(
    serverConfig.resendWebhookSecret,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    body,
  );
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const result = await handleResendEvent(JSON.parse(body));
  return NextResponse.json(result);
}
