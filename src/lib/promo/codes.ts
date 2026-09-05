import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";

export type PromoDiscountType = "FIXED" | "PERCENT";

export type PromoCodeRow = {
  id: string;
  code: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  note: string | null;
};

export type PromoQuote =
  | {
      ok: true;
      promoId: string;
      code: string;
      discountType: PromoDiscountType;
      discountValue: number;
      discountAmount: number;
      originalAmount: number;
      finalAmount: number;
      discountLabel: string;
      finalLabel: string;
      originalLabel: string;
    }
  | { ok: false; error: string };

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function computePromoAmounts(
  coursePrice: number,
  discountType: PromoDiscountType,
  discountValue: number,
) {
  const original = Math.max(0, Number(coursePrice));
  let discountAmount = 0;
  if (discountType === "FIXED") {
    discountAmount = Math.min(original, Number(discountValue));
  } else {
    const pct = Math.min(100, Math.max(0, Number(discountValue)));
    discountAmount = Number(((original * pct) / 100).toFixed(2));
  }
  const finalAmount = Number(Math.max(0, original - discountAmount).toFixed(2));
  return { originalAmount: original, discountAmount, finalAmount };
}

export async function validateAndQuotePromo(
  codeInput: string,
  coursePrice: number,
): Promise<PromoQuote> {
  const code = normalizePromoCode(codeInput);
  if (!code) {
    return { ok: false, error: "Enter a promo code." };
  }

  const admin = createServiceClient();
  const { data: promo, error } = await admin
    .from("promo_codes")
    .select(
      "id, code, discount_type, discount_value, max_redemptions, redeemed_count, active, starts_at, ends_at, note",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!promo) {
    return { ok: false, error: "Invalid promo code." };
  }
  if (!promo.active) {
    return { ok: false, error: "This promo code is no longer active." };
  }

  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) {
    return { ok: false, error: "This promo code is not available yet." };
  }
  if (promo.ends_at && new Date(promo.ends_at).getTime() < now) {
    return { ok: false, error: "This promo code has expired." };
  }
  if (
    promo.max_redemptions != null &&
    promo.redeemed_count >= promo.max_redemptions
  ) {
    return {
      ok: false,
      error: "This promo code is fully claimed na. Walay slot left.",
    };
  }

  const { originalAmount, discountAmount, finalAmount } = computePromoAmounts(
    coursePrice,
    promo.discount_type as PromoDiscountType,
    Number(promo.discount_value),
  );

  if (finalAmount > 0 && finalAmount < 20) {
    return {
      ok: false,
      error:
        "Discounted total is below ₱20 (PayMongo minimum). Use another code or contact the team.",
    };
  }

  return {
    ok: true,
    promoId: promo.id,
    code: promo.code,
    discountType: promo.discount_type as PromoDiscountType,
    discountValue: Number(promo.discount_value),
    discountAmount,
    originalAmount,
    finalAmount,
    discountLabel: formatPeso(discountAmount),
    finalLabel: formatPeso(finalAmount),
    originalLabel: formatPeso(originalAmount),
  };
}

/**
 * Bind promo to a payment: reserve a slot once if payment did not already use this promo.
 */
export async function bindPromoToPayment(input: {
  paymentId: string;
  promoId: string;
  originalAmount: number;
  finalAmount: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, promo_code_id, status")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (!payment) {
    return { ok: false, error: "Payment not found." };
  }

  if (payment.promo_code_id === input.promoId) {
    await admin
      .from("payments")
      .update({
        amount: input.finalAmount,
        original_amount: input.originalAmount,
        promo_code_id: input.promoId,
      })
      .eq("id", input.paymentId);
    return { ok: true };
  }

  if (payment.promo_code_id && payment.promo_code_id !== input.promoId) {
    return {
      ok: false,
      error: "This payment already has another promo. Contact the team if you need help.",
    };
  }

  const { data: reserved, error: reserveError } = await admin.rpc(
    "promo_reserve_slot",
    { p_promo_id: input.promoId },
  );

  if (reserveError) {
    return { ok: false, error: reserveError.message };
  }
  if (!reserved) {
    return {
      ok: false,
      error: "This promo code is fully claimed na. Walay slot left.",
    };
  }

  const { error } = await admin
    .from("payments")
    .update({
      amount: input.finalAmount,
      original_amount: input.originalAmount,
      promo_code_id: input.promoId,
    })
    .eq("id", input.paymentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
