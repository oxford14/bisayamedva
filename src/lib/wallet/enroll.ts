import { bindPromoToPayment } from "@/lib/promo/codes";
import { creditReferralReward } from "@/lib/referrals/reward";
import { createServiceClient } from "@/lib/supabase/admin";
import { debitWallet } from "@/lib/wallet/ledger";

export type EnrollWithWalletResult =
  | {
      ok: true;
      enrollmentId: string;
      balance: number;
      alreadyActive: boolean;
    }
  | { ok: false; error: string; shortfall?: number; balance?: number };

/**
 * Debits wallet for course price and sets enrollment ACTIVE.
 * Creates PENDING_PAYMENT enrollment if needed, then activates.
 */
export async function enrollWithWallet(input: {
  studentId: string;
  courseId: string;
  enrollmentId?: string | null;
  amountPesos?: number;
  promoId?: string | null;
  originalAmount?: number;
}): Promise<EnrollWithWalletResult> {
  const admin = createServiceClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, title, price, currency, status, slug")
    .eq("id", input.courseId)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (!course) {
    return { ok: false, error: "Course is not available for enrollment." };
  }

  const listPrice = Number(course.price);
  let price = input.amountPesos;

  let enrollment: { id: string; status: string } | null = null;

  if (input.enrollmentId) {
    const { data } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("id", input.enrollmentId)
      .eq("student_id", input.studentId)
      .maybeSingle();
    enrollment = data;
  }

  if (!enrollment) {
    // One enrollment row per (student, course): reuse it, even if cancelled.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("student_id", input.studentId)
      .eq("course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    enrollment = existing;
  }

  if (enrollment?.status === "ACTIVE" || enrollment?.status === "COMPLETED") {
    await creditReferralReward(enrollment.id);
    return {
      ok: true,
      enrollmentId: enrollment.id,
      balance: 0,
      alreadyActive: true,
    };
  }

  if (enrollment && enrollment.status !== "CANCELLED") {
    const { data: paidPayment } = await admin
      .from("payments")
      .select("id")
      .eq("enrollment_id", enrollment.id)
      .eq("status", "PAID")
      .maybeSingle();
    if (paidPayment) {
      await creditReferralReward(enrollment.id);
      return {
        ok: true,
        enrollmentId: enrollment.id,
        balance: 0,
        alreadyActive: true,
      };
    }
  }

  if (!enrollment) {
    const { data: created, error } = await admin
      .from("enrollments")
      .insert({
        student_id: input.studentId,
        course_id: course.id,
        session_id: null,
        status: "PENDING_PAYMENT",
      })
      .select("id, status")
      .single();
    if (error || !created) {
      return {
        ok: false,
        error: error?.message ?? "Could not create enrollment.",
      };
    }
    enrollment = created;
  } else if (enrollment.status === "CANCELLED") {
    const { data: reopened, error } = await admin
      .from("enrollments")
      .update({ status: "PENDING_PAYMENT" })
      .eq("id", enrollment.id)
      .select("id, status")
      .single();
    if (error || !reopened) {
      return {
        ok: false,
        error: error?.message ?? "Could not reopen enrollment.",
      };
    }
    enrollment = reopened;
  }

  if (price == null && enrollment) {
    const { data: pendingPay } = await admin
      .from("payments")
      .select("amount, promo_code_id")
      .eq("enrollment_id", enrollment.id)
      .neq("status", "CANCELLED")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingPay?.amount != null) {
      price = Number(pendingPay.amount);
    }
  }
  if (price == null) price = listPrice;
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Invalid course price." };
  }

  const { data: wallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("student_id", input.studentId)
    .maybeSingle();

  const balance = Number(wallet?.balance ?? 0);
  if (price > 0 && balance < price) {
    return {
      ok: false,
      error: "Kulang imong wallet balance. Top up first, then enroll.",
      shortfall: Number((price - balance).toFixed(2)),
      balance,
    };
  }

  let nextBalance = balance;
  let walletRef = "wallet:promo";

  if (price > 0) {
    const debit = await debitWallet({
      studentId: input.studentId,
      amount: price,
      type: "ENROLL_SPEND",
      referenceType: "enrollment",
      referenceId: enrollment.id,
      note: course.title,
    });

    if (!debit.ok) {
      return {
        ok: false,
        error: debit.error,
        shortfall: debit.error.includes("Insufficient")
          ? Number((price - balance).toFixed(2))
          : undefined,
        balance,
      };
    }
    nextBalance = debit.balance;
    walletRef = `wallet:${debit.transactionId}`;
  }

  const { error: activateError } = await admin
    .from("enrollments")
    .update({ status: "ACTIVE" })
    .eq("id", enrollment.id);

  if (activateError) {
    if (price > 0) {
      const { creditWallet } = await import("@/lib/wallet/ledger");
      await creditWallet({
        studentId: input.studentId,
        amount: price,
        type: "ADMIN_ADJUST",
        referenceType: "enrollment",
        referenceId: enrollment.id,
        note: "Enrollment activate failed — auto refund to wallet",
      });
    }
    return { ok: false, error: activateError.message };
  }

  const originalAmount = input.originalAmount ?? listPrice;
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id, status")
    .eq("enrollment_id", enrollment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let paymentId = existingPayment?.id;
  if (!existingPayment) {
    const { data: createdPayment } = await admin
      .from("payments")
      .insert({
        enrollment_id: enrollment.id,
        amount: price,
        original_amount: originalAmount,
        currency: course.currency || "PHP",
        status: "PAID",
        provider: "PAYMONGO",
        provider_payment_id: walletRef,
      })
      .select("id")
      .single();
    paymentId = createdPayment?.id;
  } else if (existingPayment.status !== "PAID") {
    await admin
      .from("payments")
      .update({
        status: "PAID",
        provider_payment_id: walletRef,
        amount: price,
        original_amount: originalAmount,
      })
      .eq("id", existingPayment.id);
  }

  if (input.promoId && paymentId) {
    await bindPromoToPayment({
      paymentId,
      promoId: input.promoId,
      originalAmount,
      finalAmount: price,
    });
  }

  await creditReferralReward(enrollment.id);

  return {
    ok: true,
    enrollmentId: enrollment.id,
    balance: nextBalance,
    alreadyActive: false,
  };
}
