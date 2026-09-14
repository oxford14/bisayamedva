"use server";

import { randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  authCopy,
  experienceLevels,
  referralSources,
  site,
} from "@/content/site";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { activatePaidEnrollment } from "@/lib/paymongo/activate";
import {
  createLiveQrPhCheckout,
  retrievePaymentIntent,
} from "@/lib/paymongo/client";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { formatPeso } from "@/lib/utils";
import {
  bindPromoToPayment,
  validateAndQuotePromo,
} from "@/lib/promo/codes";
import {
  expireStalePendingPayments,
  PAYMENT_HOLD_MS,
} from "@/lib/payments/expire-pending";
import { findProfileIdByEmail } from "@/lib/register/create-student";
import { finalizeRegistrationFromPayment } from "@/lib/register/finalize-intent";
import {
  clearRegistrationPayloadFields,
  encryptRegistrationPayload,
} from "@/lib/register/intent-crypto";

const draftSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  mobile: z.string().min(10),
  password: z.string().min(8),
  occupation: z.string().optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  messengerName: z.string().optional(),
  referralSource: z.enum(referralSources).optional(),
  promoCode: z.string().optional(),
  refCode: z.string().optional(),
});

export type CheckoutPrepareResult =
  | {
      ok: true;
      paymentId: string;
      enrollmentId: string;
      pollSecret: string;
      qrImageUrl: string;
      amountLabel: string;
      courseTitle: string;
      providerPaymentId: string;
      alreadyPaid: boolean;
      needsSignIn?: boolean;
      expiresAt?: string;
    }
  | { ok: false; error: string; code?: "EMAIL_TAKEN" };

export type CheckRegisterEmailResult =
  | { ok: true }
  | { ok: false; error: string; code: "EMAIL_TAKEN" | "INVALID_EMAIL" };

class RegisterEmailTakenError extends Error {
  readonly code = "EMAIL_TAKEN" as const;

  constructor() {
    super(authCopy.register.emailTaken);
    this.name = "RegisterEmailTakenError";
  }
}

function verifyPollSecret(stored: string | null, provided: string | null) {
  if (!stored || !provided) return false;
  try {
    const a = Buffer.from(stored);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function cancelPendingIntentsForEmail(email: string) {
  const admin = createServiceClient();
  const normalized = email.trim().toLowerCase();

  const { data: pending } = await admin
    .from("registration_intents")
    .select("id")
    .eq("email", normalized)
    .eq("status", "PENDING");

  const intentIds = (pending ?? []).map((row) => row.id);
  if (intentIds.length === 0) return;

  await admin
    .from("registration_intents")
    .update({
      status: "EXPIRED",
      ...clearRegistrationPayloadFields(),
    })
    .in("id", intentIds)
    .eq("status", "PENDING");

  await admin
    .from("payments")
    .update({ status: "FAILED" })
    .in("registration_intent_id", intentIds)
    .eq("status", "PENDING")
    .is("enrollment_id", null);
}

export async function checkRegisterEmail(
  email: string,
): Promise<CheckRegisterEmailResult> {
  const parsed = z.string().email().safeParse(email.trim());
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please enter a valid email address.",
      code: "INVALID_EMAIL",
    };
  }

  const existingId = await findProfileIdByEmail(parsed.data);
  if (existingId) {
    return {
      ok: false,
      error: authCopy.register.emailTaken,
      code: "EMAIL_TAKEN",
    };
  }

  return { ok: true };
}

export type CheckoutActionResult =
  | { ok: true; redirectTo?: string; status?: string; needsSignIn?: boolean }
  | { ok: false; error: string };

async function resolveFeaturedCourse() {
  const admin = createServiceClient();

  const { data: settings } = await admin
    .from("site_settings")
    .select("key, value");
  const map = Object.fromEntries(
    (settings ?? []).map((row) => [row.key, row.value]),
  );

  function unwrap(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === "string") return value.replace(/^"|"$/g, "");
    return String(value);
  }

  let courseId = unwrap(map.featured_course_id);

  let course =
    courseId
      ? (
          await admin
            .from("courses")
            .select("id, title, price, currency, status")
            .eq("id", courseId)
            .maybeSingle()
        ).data
      : null;

  if (!course) {
    const { data: fallbackCourse } = await admin
      .from("courses")
      .select("id, title, price, currency, status")
      .eq("status", "PUBLISHED")
      .eq("slug", site.featuredCourse.id)
      .maybeSingle();
    course = fallbackCourse;
    courseId = fallbackCourse?.id ?? null;
  }

  if (!course) {
    const { data: basicFallback } = await admin
      .from("courses")
      .select("id, title, price, currency, status")
      .eq("status", "PUBLISHED")
      .eq("course_type", "BASIC")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    course = basicFallback;
    courseId = basicFallback?.id ?? null;
  }

  if (!course) {
    throw new Error(
      "No published featured course found. Set the Featured Course in Admin Content first.",
    );
  }

  return { course };
}

export async function quoteRegisterPromo(code: string) {
  const { getFeaturedOffer } = await import("@/lib/content/featured-offer");
  const offer = await getFeaturedOffer();
  return validateAndQuotePromo(code, offer.course.price);
}

export async function prepareCheckoutPayment(
  draftInput: unknown,
): Promise<CheckoutPrepareResult> {
  try {
    const parsed = draftSchema.safeParse(draftInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Missing registration details. Balik sa register page.",
      };
    }

    const draft = parsed.data;
    const email = draft.email.trim().toLowerCase();

    const existingId = await findProfileIdByEmail(email);
    if (existingId) {
      throw new RegisterEmailTakenError();
    }

    await expireStalePendingPayments();
    await cancelPendingIntentsForEmail(email);

    const { course } = await resolveFeaturedCourse();
    const admin = createServiceClient();

    const coursePrice = Number(course.price);
    let finalAmount = coursePrice;
    let originalAmount = coursePrice;
    let promoId: string | null = null;

    if (draft.promoCode?.trim()) {
      const quote = await validateAndQuotePromo(draft.promoCode, coursePrice);
      if (!quote.ok) {
        return { ok: false, error: quote.error };
      }
      finalAmount = quote.finalAmount;
      originalAmount = quote.originalAmount;
      promoId = quote.promoId;
    }

    const expiresAt = new Date(Date.now() + PAYMENT_HOLD_MS).toISOString();
    const { ciphertext, iv } = encryptRegistrationPayload(draft);

    const { data: intent, error: intentError } = await admin
      .from("registration_intents")
      .insert({
        email,
        course_id: course.id,
        payload_ciphertext: ciphertext,
        payload_iv: iv,
        promo_code_id: promoId,
        original_amount: originalAmount,
        final_amount: finalAmount,
        ref_code: draft.refCode?.trim() || null,
        status: "PENDING",
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (intentError || !intent) {
      return {
        ok: false,
        error: intentError?.message ?? "Could not start registration checkout.",
      };
    }

    const pollSecret = randomBytes(32).toString("base64url");

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        registration_intent_id: intent.id,
        enrollment_id: null,
        amount: finalAmount,
        original_amount: originalAmount,
        currency: course.currency || "PHP",
        status: "PENDING",
        provider: "PAYMONGO",
        poll_secret: pollSecret,
      })
      .select(
        "id, amount, currency, status, provider_payment_id, promo_code_id, original_amount",
      )
      .single();

    if (paymentError || !payment) {
      return {
        ok: false,
        error: paymentError?.message ?? "Could not create payment.",
      };
    }

    if (promoId) {
      const bound = await bindPromoToPayment({
        paymentId: payment.id,
        promoId,
        originalAmount,
        finalAmount,
      });
      if (!bound.ok) {
        return { ok: false, error: bound.error };
      }
    }

    const paidSuccess = (enrollmentId: string) => ({
      ok: true as const,
      paymentId: payment.id,
      enrollmentId,
      pollSecret,
      qrImageUrl: "",
      amountLabel: formatPeso(Number(payment.amount)),
      courseTitle: course.title,
      providerPaymentId: payment.provider_payment_id ?? "",
      alreadyPaid: true,
      needsSignIn: true,
    });

    if (Number(payment.amount) === 0) {
      await admin
        .from("payments")
        .update({ status: "PAID", provider: "PAYMONGO" })
        .eq("id", payment.id);
      const finalized = await finalizeRegistrationFromPayment({
        paymentId: payment.id,
      });
      return paidSuccess(finalized.enrollmentId);
    }

    let providerPaymentId = payment.provider_payment_id ?? "";

    if (providerPaymentId) {
      try {
        const paymongoIntent = await retrievePaymentIntent(providerPaymentId);
        if (paymongoIntent.attributes.status === "succeeded") {
          const activated = await activatePaidEnrollment({
            paymentId: payment.id,
          });
          return paidSuccess(activated.enrollmentId);
        }
      } catch {
        // Fall through and create a fresh QR checkout.
      }
    }

    const live = await createLiveQrPhCheckout({
      amountPesos: Number(payment.amount),
      description: `${course.title} · Bisaya MedVA`,
      metadata: {
        kind: "registration",
        payment_id: payment.id,
        registration_intent_id: intent.id,
      },
    });

    providerPaymentId = live.paymentIntentId;
    const qrImageUrl = normalizeQrSrc(live.qrImageUrl);

    await admin
      .from("payments")
      .update({
        provider: "PAYMONGO",
        provider_payment_id: providerPaymentId,
        status: "PENDING",
        amount: Number(payment.amount),
      })
      .eq("id", payment.id);

    return {
      ok: true,
      paymentId: payment.id,
      enrollmentId: "",
      pollSecret,
      qrImageUrl,
      amountLabel: formatPeso(Number(payment.amount)),
      courseTitle: course.title,
      providerPaymentId,
      alreadyPaid: false,
      expiresAt: intent.expires_at,
    };
  } catch (error) {
    if (error instanceof RegisterEmailTakenError) {
      return { ok: false, error: error.message, code: "EMAIL_TAKEN" };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Checkout failed.",
    };
  }
}

async function afterRegistrationPaid(): Promise<CheckoutActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { ok: true, redirectTo: "/member", status: "PAID" };
  }

  return { ok: true, status: "PAID", needsSignIn: true };
}

export async function refreshCheckoutPaymentStatus(
  paymentId: string,
  pollSecret?: string | null,
): Promise<CheckoutActionResult> {
  try {
    if (!paymentId) return { ok: false, error: "Missing payment id." };

    await expireStalePendingPayments();

    const admin = createServiceClient();
    const { data: payment } = await admin
      .from("payments")
      .select(
        "id, status, provider_payment_id, enrollment_id, registration_intent_id, poll_secret, registration_intents(status, expires_at)",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) return { ok: false, error: "Payment not found." };

    const isIntentCheckout = Boolean(payment.registration_intent_id);

    if (isIntentCheckout) {
      if (!verifyPollSecret(payment.poll_secret, pollSecret ?? null)) {
        return { ok: false, error: "Invalid checkout session." };
      }

      const intent = Array.isArray(payment.registration_intents)
        ? payment.registration_intents[0]
        : payment.registration_intents;

      if (
        intent?.status === "EXPIRED" ||
        (intent?.status === "PENDING" &&
          intent.expires_at &&
          new Date(intent.expires_at).getTime() <= Date.now())
      ) {
        return { ok: true, status: "EXPIRED" };
      }

      if (payment.status === "PAID") {
        return afterRegistrationPaid();
      }

      if (payment.status === "FAILED") {
        return { ok: true, status: "EXPIRED" };
      }

      if (payment.provider_payment_id) {
        const paymongoIntent = await retrievePaymentIntent(
          payment.provider_payment_id,
        );
        if (paymongoIntent.attributes.status === "succeeded") {
          await activatePaidEnrollment({ paymentId: payment.id });
          return afterRegistrationPaid();
        }
        return { ok: true, status: paymongoIntent.attributes.status };
      }

      return { ok: false, error: "No PayMongo intent yet." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please log in first." };

    const { data: paymentWithEnrollment } = await admin
      .from("payments")
      .select(
        "id, status, provider_payment_id, enrollment_id, enrollments(student_id, status)",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (!paymentWithEnrollment) {
      return { ok: false, error: "Payment not found." };
    }

    const enrollment = Array.isArray(paymentWithEnrollment.enrollments)
      ? paymentWithEnrollment.enrollments[0]
      : paymentWithEnrollment.enrollments;
    if (!enrollment || enrollment.student_id !== user.id) {
      return { ok: false, error: "This payment is not linked to your account." };
    }

    if (paymentWithEnrollment.status === "PAID") {
      return { ok: true, redirectTo: "/member", status: "PAID" };
    }

    if (paymentWithEnrollment.provider_payment_id) {
      const paymongoIntent = await retrievePaymentIntent(
        paymentWithEnrollment.provider_payment_id,
      );
      if (paymongoIntent.attributes.status === "succeeded") {
        await activatePaidEnrollment({ paymentId: paymentWithEnrollment.id });
        return { ok: true, redirectTo: "/member", status: "PAID" };
      }
      if (
        paymentWithEnrollment.status === "FAILED" ||
        enrollment.status === "CANCELLED"
      ) {
        return { ok: true, status: "EXPIRED" };
      }
      return { ok: true, status: paymongoIntent.attributes.status };
    }

    if (
      paymentWithEnrollment.status === "FAILED" ||
      enrollment.status === "CANCELLED"
    ) {
      return { ok: true, status: "EXPIRED" };
    }

    return { ok: false, error: "No PayMongo intent yet." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Status check failed.",
    };
  }
}

export async function completeRegisterCheckout(input: {
  paymentId: string;
  pollSecret: string;
  password: string;
}): Promise<CheckoutActionResult> {
  try {
    const paymentId = input.paymentId?.trim();
    const pollSecret = input.pollSecret?.trim();
    const password = input.password;

    if (!paymentId || !pollSecret || !password) {
      return { ok: false, error: "Missing checkout details." };
    }

    const admin = createServiceClient();
    const { data: payment } = await admin
      .from("payments")
      .select(
        "id, status, poll_secret, registration_intent_id, registration_intents(status)",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment?.registration_intent_id) {
      return { ok: false, error: "Invalid registration checkout." };
    }

    if (!verifyPollSecret(payment.poll_secret, pollSecret)) {
      return { ok: false, error: "Invalid checkout session." };
    }

    if (payment.status !== "PAID") {
      return { ok: false, error: "Payment is not confirmed yet." };
    }

    const intent = Array.isArray(payment.registration_intents)
      ? payment.registration_intents[0]
      : payment.registration_intents;

    if (intent?.status !== "FULFILLED") {
      await activatePaidEnrollment({ paymentId: payment.id });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return { ok: true, redirectTo: "/member", status: "PAID" };
    }

    const { data: intentRow } = await admin
      .from("registration_intents")
      .select("email")
      .eq("id", payment.registration_intent_id)
      .maybeSingle();

    const email = intentRow?.email?.trim().toLowerCase();
    if (!email) {
      return { ok: false, error: "Could not resolve account email." };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return {
        ok: false,
        error:
          signInError.message ||
          "Account ready, but login failed. Try logging in manually.",
      };
    }

    return { ok: true, redirectTo: "/member", status: "PAID" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not finish checkout.",
    };
  }
}
