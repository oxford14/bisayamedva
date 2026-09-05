import { revalidatePath } from "next/cache";
import {
  createLiveQrPhCheckout,
  retrievePaymentIntent,
} from "@/lib/paymongo/client";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";
import { creditWallet } from "@/lib/wallet/ledger";
import { enrollWithWallet } from "@/lib/wallet/enroll";

export type WalletTopupPrepareResult =
  | {
      ok: true;
      topupId: string;
      qrImageUrl: string;
      amountLabel: string;
      providerPaymentId: string;
      alreadyPaid: boolean;
      enrolled?: boolean;
    }
  | { ok: false; error: string };

export async function prepareWalletTopup(input: {
  studentId: string;
  amountPesos: number;
  intentEnrollmentId?: string | null;
  intentCourseId?: string | null;
  intentSessionId?: string | null;
}): Promise<WalletTopupPrepareResult> {
  try {
    if (!(input.amountPesos > 0)) {
      return { ok: false, error: "Enter a top-up amount greater than zero." };
    }

    const admin = createServiceClient();

    const { data: topup, error } = await admin
      .from("wallet_topups")
      .insert({
        student_id: input.studentId,
        amount: input.amountPesos,
        currency: "PHP",
        status: "PENDING",
        provider: "PAYMONGO",
        intent_enrollment_id: input.intentEnrollmentId ?? null,
        intent_course_id: input.intentCourseId ?? null,
        intent_session_id: input.intentSessionId ?? null,
      })
      .select("id, amount, status, provider_payment_id")
      .single();

    if (error || !topup) {
      return {
        ok: false,
        error: error?.message ?? "Could not create wallet top-up.",
      };
    }

    const live = await createLiveQrPhCheckout({
      amountPesos: Number(topup.amount),
      description: `Wallet top-up · Bisaya MedVA`,
      metadata: {
        kind: "wallet_topup",
        topup_id: topup.id,
        student_id: input.studentId,
      },
    });

    const providerPaymentId = live.paymentIntentId;
    const qrImageUrl = normalizeQrSrc(live.qrImageUrl);

    await admin
      .from("wallet_topups")
      .update({
        provider_payment_id: providerPaymentId,
        status: "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", topup.id);

    return {
      ok: true,
      topupId: topup.id,
      qrImageUrl,
      amountLabel: formatPeso(Number(topup.amount)),
      providerPaymentId,
      alreadyPaid: false,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Top-up failed.",
    };
  }
}

export type ActivateTopupResult = {
  ok: true;
  topupId: string;
  alreadyPaid: boolean;
  enrolled: boolean;
  balance: number;
};

/**
 * Credits wallet for a paid top-up. Idempotent when already PAID.
 * If enroll intent is set, attempts wallet enroll after credit.
 */
export async function activateWalletTopup(input: {
  topupId?: string | null;
  providerPaymentId?: string | null;
}): Promise<ActivateTopupResult> {
  const admin = createServiceClient();

  let topup: {
    id: string;
    student_id: string;
    amount: number;
    status: string;
    provider_payment_id: string | null;
    intent_enrollment_id: string | null;
    intent_course_id: string | null;
    intent_session_id: string | null;
  } | null = null;

  if (input.topupId) {
    const { data } = await admin
      .from("wallet_topups")
      .select(
        "id, student_id, amount, status, provider_payment_id, intent_enrollment_id, intent_course_id, intent_session_id",
      )
      .eq("id", input.topupId)
      .maybeSingle();
    topup = data;
  }

  if (!topup && input.providerPaymentId) {
    const { data } = await admin
      .from("wallet_topups")
      .select(
        "id, student_id, amount, status, provider_payment_id, intent_enrollment_id, intent_course_id, intent_session_id",
      )
      .eq("provider_payment_id", input.providerPaymentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    topup = data;
  }

  if (!topup) {
    throw new Error("Wallet top-up not found.");
  }

  if (topup.status === "PAID") {
    return {
      ok: true,
      topupId: topup.id,
      alreadyPaid: true,
      enrolled: false,
      balance: 0,
    };
  }

  const credit = await creditWallet({
    studentId: topup.student_id,
    amount: Number(topup.amount),
    type: "TOP_UP",
    referenceType: "wallet_topup",
    referenceId: topup.id,
    note: "PayMongo wallet top-up",
  });

  if (!credit.ok) {
    throw new Error(credit.error);
  }

  const { error: updateError } = await admin
    .from("wallet_topups")
    .update({
      status: "PAID",
      updated_at: new Date().toISOString(),
    })
    .eq("id", topup.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  let enrolled = false;
  if (topup.intent_session_id && topup.intent_course_id) {
    const result = await enrollWithWallet({
      studentId: topup.student_id,
      courseId: topup.intent_course_id,
      sessionId: topup.intent_session_id,
      enrollmentId: topup.intent_enrollment_id,
    });
    enrolled = result.ok;
  }

  revalidatePath("/member");
  revalidatePath("/member/wallet");
  revalidatePath("/member/course");
  revalidatePath("/member/schedule");
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/payments");

  return {
    ok: true,
    topupId: topup.id,
    alreadyPaid: false,
    enrolled,
    balance: credit.balance,
  };
}

export async function refreshWalletTopupStatus(topupId: string) {
  const { expireStalePendingPayments } = await import(
    "@/lib/payments/expire-pending"
  );
  await expireStalePendingPayments();
  const admin = createServiceClient();
  const { data: topup } = await admin
    .from("wallet_topups")
    .select("id, status, provider_payment_id, student_id, intent_enrollment_id")
    .eq("id", topupId)
    .maybeSingle();

  if (!topup) return { ok: false as const, error: "Top-up not found." };
  if (topup.status === "PAID") {
    return { ok: true as const, status: "PAID", redirectTo: "/member/wallet" };
  }
  if (!topup.provider_payment_id) {
    return { ok: false as const, error: "No PayMongo intent yet." };
  }

  const intent = await retrievePaymentIntent(topup.provider_payment_id);
  if (intent.attributes.status === "succeeded") {
    await activateWalletTopup({ topupId: topup.id });
    return { ok: true as const, status: "PAID", redirectTo: "/member/wallet" };
  }

  if (topup.intent_enrollment_id) {
    const { data: hold } = await admin
      .from("enrollments")
      .select("status")
      .eq("id", topup.intent_enrollment_id)
      .maybeSingle();
    if (hold?.status === "CANCELLED") {
      return { ok: true as const, status: "EXPIRED" };
    }
  }

  return { ok: true as const, status: intent.attributes.status };
}
