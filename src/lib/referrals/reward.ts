import { createServiceClient } from "@/lib/supabase/admin";
import { creditWallet } from "@/lib/wallet/ledger";

function roundPeso(value: number) {
  return Math.round(value * 100) / 100;
}

export async function creditReferralReward(enrollmentId: string) {
  if (!enrollmentId) return;

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("referral_rewards")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (existing) return;

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, student_id, course_id, status")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (
    !enrollment?.student_id ||
    !enrollment.course_id ||
    (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")
  ) {
    return;
  }

  const { data: student } = await admin
    .from("profiles")
    .select("id, referred_by")
    .eq("id", enrollment.student_id)
    .maybeSingle();

  const referrerId = student?.referred_by as string | null;
  if (!referrerId || referrerId === enrollment.student_id) return;

  const { data: commission } = await admin
    .from("course_referral_commissions")
    .select("mode, value, enabled")
    .eq("course_id", enrollment.course_id)
    .maybeSingle();

  if (!commission?.enabled) return;

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount, status")
    .eq("enrollment_id", enrollmentId)
    .eq("status", "PAID")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paidAmount = Number(payment?.amount ?? 0);
  const rate = Number(commission.value ?? 0);
  const amount =
    commission.mode === "PERCENT"
      ? roundPeso((paidAmount * rate) / 100)
      : roundPeso(rate);

  if (!(amount > 0)) return;

  const { data: reward, error } = await admin
    .from("referral_rewards")
    .insert({
      referrer_id: referrerId,
      referee_id: enrollment.student_id,
      course_id: enrollment.course_id,
      enrollment_id: enrollmentId,
      payment_id: payment?.id ?? null,
      amount,
    })
    .select("id")
    .single();

  if (error || !reward) {
    if (error?.code !== "23505") {
      console.error("creditReferralReward insert", error?.message);
    }
    return;
  }

  const credit = await creditWallet({
    studentId: referrerId,
    amount,
    type: "REFERRAL_EARNINGS",
    referenceType: "referral_reward",
    referenceId: reward.id,
    note: "Referral earnings",
  });

  if (!credit.ok) {
    console.error("creditReferralReward wallet", credit.error);
    return;
  }

  await admin
    .from("referral_rewards")
    .update({ wallet_txn_id: credit.transactionId })
    .eq("id", reward.id);
}