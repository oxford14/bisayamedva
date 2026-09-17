import { getCatalogCourseBySlug } from "@/content/courses";
import { validateAndQuotePromo } from "@/lib/promo/codes";
import { expireStalePendingPayments } from "@/lib/payments/expire-pending";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";
import { getOrCreateWallet } from "@/lib/wallet/ledger";
import { enrollWithWallet } from "@/lib/wallet/enroll";

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
      ok: false;
      error: string;
      code?: "INSUFFICIENT_WALLET";
      balanceLabel?: string;
      shortfallLabel?: string;
      shortfallAmount?: number;
      totalLabel?: string;
    };

export type MemberCheckoutReview =
  | {
      ok: true;
      courseTitle: string;
      coursePrice: number;
      coursePriceLabel: string;
      sessionLabel: string;
      balance: number;
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
  const balance = Number(wallet.balance);
  return {
    ok: true,
    courseTitle: offer.course.title,
    coursePrice: price,
    coursePriceLabel: formatPeso(price),
    sessionLabel: formatMemberSessionLabel(offer.session),
    balance,
    balanceLabel: formatPeso(balance),
  };
}

/**
 * Member enroll: debit wallet when balance covers the course total.
 * If kulang, return INSUFFICIENT_WALLET — student tops up sa Wallet page first.
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

    const { course, session } = offer;
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
        balanceLabel: formatPeso(enrolled.balance ?? wallet.balance),
        alreadyActive: enrolled.alreadyActive,
        courseTitle: course.title,
        sessionLabel: label,
      };
    }

    const balance = enrolled.balance ?? Number(wallet.balance);
    const shortfall =
      enrolled.shortfall ??
      Math.max(0, Number((finalAmount - balance).toFixed(2)));

    if (shortfall > 0 || enrolled.error.includes("Kulang")) {
      return {
        ok: false,
        code: "INSUFFICIENT_WALLET",
        error: enrolled.error,
        balanceLabel: formatPeso(balance),
        shortfallLabel: formatPeso(shortfall),
        shortfallAmount: shortfall,
        totalLabel: formatPeso(finalAmount),
      };
    }

    return { ok: false, error: enrolled.error };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Checkout failed.",
    };
  }
}
