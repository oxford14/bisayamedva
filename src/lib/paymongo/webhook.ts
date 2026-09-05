import { createHmac, timingSafeEqual } from "crypto";

export function requireWebhookSecret() {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing PAYMONGO_WEBHOOK_SECRET.");
  }
  return secret;
}

function parseSignatureHeader(header: string | null) {
  if (!header) return null;
  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const [key, value] = segment.split("=").map((s) => s.trim());
    if (key && value) parts[key] = value;
  }
  if (!parts.t || (!parts.te && !parts.li)) return null;
  return parts;
}

/**
 * Verify PayMongo webhook signature.
 * Uses live (`li`) when present, otherwise test (`te`).
 */
export function verifyPaymongoSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
  toleranceSeconds?: number;
}): boolean {
  const parsed = parseSignatureHeader(input.signatureHeader);
  if (!parsed) return false;

  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp)) return false;

  const tolerance = input.toleranceSeconds ?? 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) return false;

  const expectedSig = parsed.li || parsed.te;
  if (!expectedSig) return false;

  const signedPayload = `${parsed.t}.${input.rawBody}`;
  const computed = createHmac("sha256", input.secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(computed, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type PaymongoWebhookEvent = {
  data?: {
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        type?: string;
        attributes?: {
          payment_intent_id?: string | null;
          status?: string;
          metadata?: Record<string, string | null | undefined> | null;
        };
      };
    };
  };
};

export function extractActivationRefs(event: PaymongoWebhookEvent): {
  eventType: string | null;
  providerPaymentId: string | null;
  paymentId: string | null;
  topupId: string | null;
  kind: string | null;
} {
  const eventType = event.data?.attributes?.type ?? null;
  const resource = event.data?.attributes?.data;
  const attrs = resource?.attributes;

  let providerPaymentId: string | null = null;
  let paymentId: string | null = null;
  let topupId: string | null = null;
  let kind: string | null = null;

  const meta = attrs?.metadata;
  if (meta?.kind && typeof meta.kind === "string") {
    kind = meta.kind;
  }
  if (meta?.topup_id && typeof meta.topup_id === "string") {
    topupId = meta.topup_id;
  }
  if (meta?.payment_id && typeof meta.payment_id === "string") {
    paymentId = meta.payment_id;
  }

  if (eventType === "payment.paid") {
    providerPaymentId = attrs?.payment_intent_id ?? null;
  } else if (eventType === "payment_intent.succeeded") {
    providerPaymentId = resource?.id ?? null;
  }

  return { eventType, providerPaymentId, paymentId, topupId, kind };
}
