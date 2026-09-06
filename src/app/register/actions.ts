"use server";

import { z } from "zod";
import { authCopy, experienceLevels, referralSources } from "@/content/site";
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
  isPendingHoldFresh,
  pendingHoldExpiresAt,
} from "@/lib/payments/expire-pending";
import { applyReferredBy, resolveReferralCode } from "@/lib/referrals/codes";
import { creditReferralReward } from "@/lib/referrals/reward";

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
      qrImageUrl: string;
      amountLabel: string;
      courseTitle: string;
      providerPaymentId: string;
      alreadyPaid: boolean;
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

function escapeIlikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function findProfileIdByEmail(email: string) {
  const admin = createServiceClient();
  const normalized = email.trim().toLowerCase();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", escapeIlikePattern(normalized))
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
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
  | { ok: true; redirectTo?: string; status?: string }
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
      .eq("course_type", "BASIC")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    course = fallbackCourse;
    courseId = fallbackCourse?.id ?? null;
  }

  if (!course) {
    throw new Error(
      "No published featured course found. Set the Featured Course in Admin Content first.",
    );
  }

  return { course };
}

async function ensureStudentUser(draft: z.infer<typeof draftSchema>) {
  const admin = createServiceClient();
  const email = draft.email.trim().toLowerCase();
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();
  const referrer = await resolveReferralCode(draft.refCode);
  const referralSource = referrer
    ? draft.referralSource || "Referral"
    : draft.referralSource ?? null;
  const metadata = {
    full_name: fullName,
    first_name: draft.firstName,
    last_name: draft.lastName,
    mobile: draft.mobile,
    occupation: draft.occupation ?? null,
    experience_level: draft.experienceLevel ?? null,
    messenger_handle: draft.messengerName ?? null,
    referral_source: referralSource,
  };

  const existingId = await findProfileIdByEmail(email);
  if (existingId) {
    throw new RegisterEmailTakenError();
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: draft.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) {
    const message = error?.message ?? "Could not create your account.";
    if (/already/i.test(message)) {
      throw new RegisterEmailTakenError();
    }
    throw new Error(message);
  }

  const userId = data.user.id;

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: "STUDENT",
    mobile: draft.mobile,
    occupation: draft.occupation ?? null,
    experience_level: draft.experienceLevel ?? null,
    messenger_handle: draft.messengerName ?? null,
    referral_source: referralSource,
  });

  if (referrer) {
    await applyReferredBy(userId, draft.refCode);
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: draft.password,
  });
  if (signInError) {
    throw new Error(
      signInError.message ||
        "Account ready, but automatic login failed. Please log in manually.",
    );
  }

  return userId;
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
    const { course } = await resolveFeaturedCourse();
    const userId = await ensureStudentUser(draft);
    await expireStalePendingPayments();
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

    let { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status, created_at")
      .eq("student_id", userId)
      .eq("course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reuseHold =
      enrollment?.status === "PENDING_PAYMENT" &&
      isPendingHoldFresh(enrollment.created_at);
    const alreadySeated =
      enrollment?.status === "ACTIVE" || enrollment?.status === "COMPLETED";

    if (!alreadySeated && !reuseHold) {
      const nowIso = new Date().toISOString();
      if (enrollment) {
        const { data: reopened, error } = await admin
          .from("enrollments")
          .update({
            status: "PENDING_PAYMENT",
            created_at: nowIso,
          })
          .eq("id", enrollment.id)
          .select("id, status, created_at")
          .single();
        if (error || !reopened) {
          return {
            ok: false,
            error: error?.message ?? "Could not reserve a new seat.",
          };
        }
        enrollment = reopened;
      } else {
        const { data: created, error } = await admin
          .from("enrollments")
          .insert({
            student_id: userId,
            course_id: course.id,
            session_id: null,
            status: "PENDING_PAYMENT",
          })
          .select("id, status, created_at")
          .single();
        if (error || !created) {
          return { ok: false, error: error?.message ?? "Could not create enrollment." };
        }
        enrollment = created;
      }
    }

    if (!enrollment) {
      return { ok: false, error: "Could not create enrollment." };
    }

    let { data: payment } = await admin
      .from("payments")
      .select(
        "id, amount, currency, status, provider_payment_id, promo_code_id, original_amount",
      )
      .eq("enrollment_id", enrollment.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!alreadySeated && !reuseHold) {
      payment = null;
    } else if (
      payment &&
      (payment.status === "FAILED" || payment.status === "REFUNDED")
    ) {
      payment = null;
    }

    if (!payment) {
      const { data: createdPayment, error } = await admin
        .from("payments")
        .insert({
          enrollment_id: enrollment.id,
          amount: finalAmount,
          original_amount: originalAmount,
          currency: course.currency || "PHP",
          status: "PENDING",
          provider: "PAYMONGO",
        })
        .select(
          "id, amount, currency, status, provider_payment_id, promo_code_id, original_amount",
        )
        .single();
      if (error || !createdPayment) {
        return { ok: false, error: error?.message ?? "Could not create payment." };
      }
      payment = createdPayment;
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
      payment = {
        ...payment,
        amount: finalAmount,
        original_amount: originalAmount,
        promo_code_id: promoId,
      };
    } else if (!payment.promo_code_id) {
      await admin
        .from("payments")
        .update({
          amount: finalAmount,
          original_amount: originalAmount,
        })
        .eq("id", payment.id);
      payment = { ...payment, amount: finalAmount, original_amount: originalAmount };
    }

    if (payment.status === "PAID" || enrollment.status === "ACTIVE") {
      return {
        ok: true,
        paymentId: payment.id,
        enrollmentId: enrollment.id,
        qrImageUrl: "",
        amountLabel: formatPeso(Number(payment.amount)),
        courseTitle: course.title,
        providerPaymentId: payment.provider_payment_id ?? "",
        alreadyPaid: true,
      };
    }

    // Complimentary (100% off)
    if (Number(payment.amount) === 0) {
      await admin
        .from("payments")
        .update({ status: "PAID", provider: "PAYMONGO" })
        .eq("id", payment.id);
      await admin
        .from("enrollments")
        .update({ status: "ACTIVE" })
        .eq("id", enrollment.id);
      await creditReferralReward(enrollment.id);
      return {
        ok: true,
        paymentId: payment.id,
        enrollmentId: enrollment.id,
        qrImageUrl: "",
        amountLabel: formatPeso(0),
        courseTitle: course.title,
        providerPaymentId: "",
        alreadyPaid: true,
      };
    }

    let qrImageUrl = "";
    let providerPaymentId = payment.provider_payment_id ?? "";

    if (providerPaymentId) {
      try {
        const intent = await retrievePaymentIntent(providerPaymentId);
        if (intent.attributes.status === "succeeded") {
          await activatePaidEnrollment({ paymentId: payment.id });
          return {
            ok: true,
            paymentId: payment.id,
            enrollmentId: enrollment.id,
            qrImageUrl: "",
            amountLabel: formatPeso(Number(payment.amount)),
            courseTitle: course.title,
            providerPaymentId,
            alreadyPaid: true,
          };
        }
      } catch {
        // Fall through and create a fresh QR checkout.
      }
    }

    const live = await createLiveQrPhCheckout({
      amountPesos: Number(payment.amount),
      description: `${course.title} · Bisaya MedVA`,
      metadata: {
        payment_id: payment.id,
        enrollment_id: enrollment.id,
        student_id: userId,
      },
    });

    providerPaymentId = live.paymentIntentId;
    qrImageUrl = normalizeQrSrc(live.qrImageUrl);

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
      enrollmentId: enrollment.id,
      qrImageUrl,
      amountLabel: formatPeso(Number(payment.amount)),
      courseTitle: course.title,
      providerPaymentId,
      alreadyPaid: false,
      expiresAt: pendingHoldExpiresAt(enrollment.created_at).toISOString(),
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

export async function refreshCheckoutPaymentStatus(
  paymentId: string,
): Promise<CheckoutActionResult> {
  try {
    if (!paymentId) return { ok: false, error: "Missing payment id." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please log in first." };

    await expireStalePendingPayments();

    const admin = createServiceClient();
    const { data: payment } = await admin
      .from("payments")
      .select(
        "id, status, provider_payment_id, enrollment_id, enrollments(student_id, status)",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) return { ok: false, error: "Payment not found." };

    const enrollment = Array.isArray(payment.enrollments)
      ? payment.enrollments[0]
      : payment.enrollments;
    if (!enrollment || enrollment.student_id !== user.id) {
      return { ok: false, error: "This payment is not linked to your account." };
    }

    if (payment.status === "PAID") {
      return { ok: true, redirectTo: "/member", status: "PAID" };
    }

    if (payment.provider_payment_id) {
      const intent = await retrievePaymentIntent(payment.provider_payment_id);
      if (intent.attributes.status === "succeeded") {
        await activatePaidEnrollment({ paymentId: payment.id });
        return { ok: true, redirectTo: "/member", status: "PAID" };
      }
      if (payment.status === "FAILED" || enrollment.status === "CANCELLED") {
        return { ok: true, status: "EXPIRED" };
      }
      return { ok: true, status: intent.attributes.status };
    }

    if (payment.status === "FAILED" || enrollment.status === "CANCELLED") {
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
