import { NextResponse } from "next/server";
import { activatePaidEnrollment } from "@/lib/paymongo/activate";
import {
  extractActivationRefs,
  requireWebhookSecret,
  verifyPaymongoSignature,
  type PaymongoWebhookEvent,
} from "@/lib/paymongo/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let secret: string;
  try {
    secret = requireWebhookSecret();
  } catch {
    console.error("[paymongo-webhook] Missing PAYMONGO_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 },
    );
  }

  const signatureHeader = request.headers.get("paymongo-signature");
  const valid = verifyPaymongoSignature({
    rawBody,
    signatureHeader,
    secret,
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: PaymongoWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaymongoWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { eventType, providerPaymentId, paymentId } =
    extractActivationRefs(event);

  if (
    eventType !== "payment.paid" &&
    eventType !== "payment_intent.succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: eventType ?? "unknown" });
  }

  if (!providerPaymentId && !paymentId) {
    console.error("[paymongo-webhook] No payment refs on event", eventType);
    return NextResponse.json({ received: true, ignored: "missing_refs" });
  }

  try {
    const result = await activatePaidEnrollment({
      paymentId,
      providerPaymentId,
    });
    return NextResponse.json({
      received: true,
      activated: !result.alreadyActive,
      paymentId: result.paymentId,
      enrollmentId: result.enrollmentId,
    });
  } catch (error) {
    // Acknowledge to avoid endless PayMongo retries for unknown local rows;
    // log for ops follow-up.
    console.error(
      "[paymongo-webhook] Activation failed",
      error instanceof Error ? error.message : error,
      { eventType, providerPaymentId, paymentId },
    );
    return NextResponse.json({
      received: true,
      activated: false,
      error: error instanceof Error ? error.message : "Activation failed",
    });
  }
}
