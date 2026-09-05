import { getCatalogCourseBySlug } from "@/content/courses";
import { bindPromoToPayment, validateAndQuotePromo } from "@/lib/promo/codes";
import {
  expireStalePendingPayments,
  isPendingHoldFresh,
  pendingHoldExpiresAt,
} from "@/lib/payments/expire-pending";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";
import { getOrCreateWallet } from "@/lib/wallet/ledger";
import { enrollWithWallet } from "@/lib/wallet/enroll";
import { prepareWalletTopup } from "@/lib/wallet/topup";

export type MemberCheckoutPrepareResult =
  | {
      ok: true;
      mode: "enrolled";
      enrollmentId: string;
      balanceLabel: string;
      alreadyActive: boolean;
      courseTitle: string;
      sessionLabel: string;
    }
  | {
      ok: true;
      mode: "topup";
      topupId: string;
      qrImageUrl: string;
      amountLabel: string;
      providerPaymentId: string;
      balanceLabel: string;
      shortfallLabel: string;
      courseTitle: string;
      sessionLabel: string;
      coursePriceLabel: string;
      expiresAt: string;
    }
  | { ok: false; error: string };

export type MemberCheckoutReview =
  | {
      ok: true;
      courseTitle: string;
      coursePrice: number;
      coursePriceLabel: string;
      sessionLabel: string;
      balanceLabel: string;
    }
  | { ok: false; error: string };

export function formatMemberSessionLabel(session: {
  title: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
}) {
  const timezone = session.timezone || "Asia/Manila";
  const start = new Date(session.starts_at);
  const end = session.ends_at ? new Date(session.ends_at) : null;
  const day = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    timeZone: timezone,
  }).format(start);
  const dateLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(start);
  const endTime = end
    ? new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }).format(end)
    : null;
  const tz = timezone === "Asia/Manila" ? "PHT" : timezone;
  return endTime
    ? `${day} · ${dateLabel} · ${startTime}–${endTime} ${tz}`
    : `${day} · ${dateLabel} · ${startTime} ${tz}`;
}

const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMemberSessionId(id: string) {
  return SESSION_ID_RE.test(id);
}

async function loadPublishedOffer(slug: string, sessionId: string) {
  if (!getCatalogCourseBySlug(slug)) {
    return { ok: false as const, error: "Invalid course for member checkout." };
  }
  if (!sessionId || !isMemberSessionId(sessionId)) {
    return {
      ok: false as const,
      error: "Select an open schedule before checkout.",
    };
  }

  const admin = createServiceClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, title, price, currency, status, slug")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (!course) {
    return {
      ok: false as const,
      error:
        "This course is not published yet. Message the team or try again later.",
    };
  }

  const nowIso = new Date().toISOString();
  const { data: session } = await admin
    .from("sessions")
    .select("id, title, starts_at, ends_at, timezone, format, status, course_id")
    .eq("id", sessionId)
    .eq("course_id", course.id)
    .eq("status", "PUBLISHED")
    .gt("starts_at", nowIso)
    .maybeSingle();

  if (!session) {
    return {
      ok: false as const,
      error:
        "That schedule is not open anymore. Pick another open schedule or check back later.",
    };
  }

  return { ok: true as const, admin, course, session };
}

export async function getMemberCheckoutReview(
  slug: string,
  studentId: string,
  sessionId: string,
): Promise<MemberCheckoutReview> {
  const offer = await loadPublishedOffer(slug, sessionId);
  if (!offer.ok) return offer;

  const wallet = await getOrCreateWallet(studentId);
  const price = Number(offer.course.price);
  return {
    ok: true,
    courseTitle: offer.course.title,
    coursePrice: price,
    coursePriceLabel: formatPeso(price),
    sessionLabel: formatMemberSessionLabel(offer.session),
    balanceLabel: formatPeso(wallet.balance),
  };
}

/**
 * Member enroll: spend wallet if enough, otherwise prepare PayMongo top-up
 * with enroll intent (credits wallet then auto-enrolls).
 */
export async function prepareCoursePaymentForStudent(
  slug: string,
  studentId: string,
  sessionId: string,
  promoCode?: string,
): Promise<MemberCheckoutPrepareResult> {
  try {
    const offer = await loadPublishedOffer(slug, sessionId);
    if (!offer.ok) return offer;

    const { admin, course, session } = offer;
    await expireStalePendingPayments();
    const label = formatMemberSessionLabel(session);
    const wallet = await getOrCreateWallet(studentId);
    const listPrice = Number(course.price);
    let finalAmount = listPrice;
    let originalAmount = listPrice;
    let promoId: string | null = null;

    if (promoCode?.trim()) {
      const quote = await validateAndQuotePromo(promoCode, listPrice);
      if (!quote.ok) return { ok: false, error: quote.error };
      finalAmount = quote.finalAmount;
      originalAmount = quote.originalAmount;
      promoId = quote.promoId;
    }

    const enrolled = await enrollWithWallet({
      studentId,
      courseId: course.id,
      sessionId: session.id,
      amountPesos: finalAmount,
      promoId,
      originalAmount,
    });

    if (enrolled.ok) {
      return {
        ok: true,
        mode: "enrolled",
        enrollmentId: enrolled.enrollmentId,
        balanceLabel: formatPeso(enrolled.balance || wallet.balance),
        alreadyActive: enrolled.alreadyActive,
        courseTitle: course.title,
        sessionLabel: label,
      };
    }

    if (enrolled.shortfall == null && !enrolled.error.includes("Kulang")) {
      return { ok: false, error: enrolled.error };
    }

    const shortfall =
      enrolled.shortfall ??
      Math.max(0, Number((finalAmount - wallet.balance).toFixed(2)));
    const topupAmount = Math.max(shortfall, 20);

    let { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status, session_id, created_at")
      .eq("student_id", studentId)
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
            session_id: session.id,
          })
          .eq("id", enrollment.id)
          .select("id, status, session_id, created_at")
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
            student_id: studentId,
            course_id: course.id,
            session_id: session.id,
            status: "PENDING_PAYMENT",
          })
          .select("id, status, session_id, created_at")
          .single();
        if (error || !created) {
          return {
            ok: false,
            error: error?.message ?? "Could not create enrollment.",
          };
        }
        enrollment = created;
      }
    } else if (enrollment && enrollment.session_id !== session.id && reuseHold) {
      await admin
        .from("enrollments")
        .update({ session_id: session.id })
        .eq("id", enrollment.id);
    }

    if (!enrollment) {
      return { ok: false, error: "Could not create enrollment." };
    }

    let { data: payment } = reuseHold
      ? await admin
          .from("payments")
          .select("id, promo_code_id, status")
          .eq("enrollment_id", enrollment.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    if (payment && (payment.status === "FAILED" || payment.status === "REFUNDED")) {
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
        .select("id, promo_code_id, status")
        .single();
      if (error || !createdPayment) {
        return {
          ok: false,
          error: error?.message ?? "Could not create payment.",
        };
      }
      payment = createdPayment;
    } else if (payment.status !== "PAID") {
      await admin
        .from("payments")
        .update({
          amount: finalAmount,
          original_amount: originalAmount,
        })
        .eq("id", payment.id);
    }

    if (promoId && payment.status !== "PAID") {
      const bound = await bindPromoToPayment({
        paymentId: payment.id,
        promoId,
        originalAmount,
        finalAmount,
      });
      if (!bound.ok) return { ok: false, error: bound.error };
    }

    const topup = await prepareWalletTopup({
      studentId,
      amountPesos: topupAmount,
      intentEnrollmentId: enrollment.id,
      intentCourseId: course.id,
      intentSessionId: session.id,
    });

    if (!topup.ok) {
      return { ok: false, error: topup.error };
    }

    return {
      ok: true,
      mode: "topup",
      topupId: topup.topupId,
      qrImageUrl: topup.qrImageUrl,
      amountLabel: topup.amountLabel,
      providerPaymentId: topup.providerPaymentId,
      balanceLabel: formatPeso(wallet.balance),
      shortfallLabel: formatPeso(shortfall),
      courseTitle: course.title,
      sessionLabel: label,
      coursePriceLabel: formatPeso(finalAmount),
      expiresAt: pendingHoldExpiresAt(enrollment.created_at).toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Checkout failed.",
    };
  }
}
