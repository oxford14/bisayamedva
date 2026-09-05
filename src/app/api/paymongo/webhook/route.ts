import { NextResponse } from "next/server";
import { activatePaidEnrollment } from "@/lib/paymongo/activate";
import {
  extractActivationRefs,
  requireWebhookSecret,
  verifyPaymongoSignature,
  type PaymongoWebhookEvent,
} from "@/lib/paymongo/webhook";
import { expireStalePendingPayments } from "@/lib/payments/expire-pending";
import { activateWalletTopup } from "@/lib/wallet/topup";
import { createServiceClient } from "@/lib/supabase/admin";

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

  const { eventType, providerPaymentId, paymentId, topupId, kind } =
    extractActivationRefs(event);

  if (
    eventType !== "payment.paid" &&
    eventType !== "payment_intent.succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: eventType ?? "unknown" });
  }

  if (!providerPaymentId && !paymentId && !topupId) {
    console.error("[paymongo-webhook] No payment refs on event", eventType);
    return NextResponse.json({ received: true, ignored: "missing_refs" });
  }

  try {
    await expireStalePendingPayments();

    const isTopup =
      kind === "wallet_topup" ||
      Boolean(topupId) ||
      (await looksLikeWalletTopup(providerPaymentId));

    if (isTopup) {
      const result = await activateWalletTopup({
        topupId,
        providerPaymentId,
      });
      return NextResponse.json({
        received: true,
        kind: "wallet_topup",
        activated: !result.alreadyPaid,
        topupId: result.topupId,
        enrolled: result.enrolled,
      });
    }

    const result = await activatePaidEnrollment({
      paymentId,
      providerPaymentId,
    });
    return NextResponse.json({
      received: true,
      kind: "enrollment_payment",
      activated: !result.alreadyActive,
      paymentId: result.paymentId,
      enrollmentId: result.enrollmentId,
    });
  } catch (error) {
    console.error(
      "[paymongo-webhook] Activation failed",
      error instanceof Error ? error.message : error,
      { eventType, providerPaymentId, paymentId, topupId, kind },
    );
    return NextResponse.json({
      received: true,
      activated: false,
      error: error instanceof Error ? error.message : "Activation failed",
    });
  }
}

async function looksLikeWalletTopup(providerPaymentId: string | null) {
  if (!providerPaymentId) return false;
  const admin = createServiceClient();
  const { data } = await admin
    .from("wallet_topups")
    .select("id")
    .eq("provider_payment_id", providerPaymentId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}
