import { getCatalogCourseBySlug } from "@/content/courses";
import { ensureBillingPrerequisite } from "@/lib/member/course-prerequisites";
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
      includesLabel: string;
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
      includesLabel: string;
      balance: number;
      balanceLabel: string;
    }
  | { ok: false; error: string };

const INCLUDES_LABEL =
  "Includes course modules, Practice Lab, Student Lounge, and certificate.";

async function loadPublishedOffer(slug: string) {
  if (!getCatalogCourseBySlug(slug)) {
    return { ok: false as const, error: "Invalid course for member checkout." };
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

  return { ok: true as const, admin, course };
}

export async function getMemberCheckoutReview(
  slug: string,
  studentId: string,
): Promise<MemberCheckoutReview> {
  const offer = await loadPublishedOffer(slug);
  if (!offer.ok) return offer;

  const prerequisite = await ensureBillingPrerequisite(slug, studentId);
  if (!prerequisite.ok) return prerequisite;

  const wallet = await getOrCreateWallet(studentId);
  const price = Number(offer.course.price);
  const balance = Number(wallet.balance);
  return {
    ok: true,
    courseTitle: offer.course.title,
    coursePrice: price,
    coursePriceLabel: formatPeso(price),
    includesLabel: INCLUDES_LABEL,
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
  promoCode?: string,
): Promise<MemberCheckoutPrepareResult> {
  try {
    const offer = await loadPublishedOffer(slug);
    if (!offer.ok) return offer;

    const prerequisite = await ensureBillingPrerequisite(slug, studentId);
    if (!prerequisite.ok) return prerequisite;

    const { course } = offer;
    await expireStalePendingPayments();
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
        includesLabel: INCLUDES_LABEL,
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
