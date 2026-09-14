import { creditReferralReward } from "@/lib/referrals/reward";
import {
  clearRegistrationPayloadFields,
  decryptRegistrationPayload,
} from "@/lib/register/intent-crypto";
import { createStudentFromRegistrationPayload } from "@/lib/register/create-student";
import { createServiceClient } from "@/lib/supabase/admin";

export type FinalizeRegistrationResult = {
  ok: true;
  paymentId: string;
  enrollmentId: string;
  userId: string;
  alreadyFulfilled: boolean;
};

/**
 * Creates auth user + enrollment for a registration-intent payment.
 * Idempotent when intent is already fulfilled.
 */
export async function finalizeRegistrationFromPayment(input: {
  paymentId?: string | null;
  providerPaymentId?: string | null;
}): Promise<FinalizeRegistrationResult> {
  const admin = createServiceClient();

  let payment:
    | {
        id: string;
        status: string;
        enrollment_id: string | null;
        registration_intent_id: string | null;
        provider_payment_id: string | null;
      }
    | null = null;

  if (input.paymentId) {
    const { data } = await admin
      .from("payments")
      .select(
        "id, status, enrollment_id, registration_intent_id, provider_payment_id",
      )
      .eq("id", input.paymentId)
      .maybeSingle();
    payment = data;
  }

  if (!payment && input.providerPaymentId) {
    const { data } = await admin
      .from("payments")
      .select(
        "id, status, enrollment_id, registration_intent_id, provider_payment_id",
      )
      .eq("provider_payment_id", input.providerPaymentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    payment = data;
  }

  if (!payment?.registration_intent_id) {
    throw new Error("Payment is not a registration intent checkout.");
  }

  const { data: intent } = await admin
    .from("registration_intents")
    .select(
      "id, email, course_id, payload_ciphertext, payload_iv, status, fulfilled_user_id, expires_at",
    )
    .eq("id", payment.registration_intent_id)
    .maybeSingle();

  if (!intent) {
    throw new Error("Registration intent not found.");
  }

  if (intent.status === "EXPIRED") {
    throw new Error("Registration hold expired.");
  }

  if (
    intent.status === "FULFILLED" &&
    payment.enrollment_id &&
    intent.fulfilled_user_id
  ) {
    return {
      ok: true,
      paymentId: payment.id,
      enrollmentId: payment.enrollment_id,
      userId: intent.fulfilled_user_id,
      alreadyFulfilled: true,
    };
  }

  if (intent.status !== "PENDING" && intent.status !== "FULFILLED") {
    throw new Error("Registration intent is not active.");
  }

  const expiresAt = new Date(intent.expires_at).getTime();
  if (intent.status === "PENDING" && expiresAt <= Date.now()) {
    await admin
      .from("registration_intents")
      .update({
        status: "EXPIRED",
        ...clearRegistrationPayloadFields(),
      })
      .eq("id", intent.id)
      .eq("status", "PENDING");
    throw new Error("Registration hold expired.");
  }

  if (!intent.payload_ciphertext || !intent.payload_iv) {
    throw new Error("Registration payload missing.");
  }

  const draft = decryptRegistrationPayload({
    ciphertext: intent.payload_ciphertext,
    iv: intent.payload_iv,
  });

  let userId = intent.fulfilled_user_id ?? null;

  if (!userId) {
    userId = await createStudentFromRegistrationPayload(draft);
  }

  let enrollmentId = payment.enrollment_id;

  if (!enrollmentId) {
    const { data: created, error: enrollError } = await admin
      .from("enrollments")
      .insert({
        student_id: userId,
        course_id: intent.course_id,
        session_id: null,
        status: "ACTIVE",
      })
      .select("id")
      .single();
    if (enrollError || !created) {
      throw new Error(enrollError?.message ?? "Could not create enrollment.");
    }
    enrollmentId = created.id;

    const { error: linkError } = await admin
      .from("payments")
      .update({ enrollment_id: enrollmentId })
      .eq("id", payment.id);
    if (linkError) {
      throw new Error(linkError.message);
    }
  } else {
    const { error: enrollError } = await admin
      .from("enrollments")
      .update({ status: "ACTIVE" })
      .eq("id", enrollmentId)
      .neq("status", "ACTIVE");
    if (enrollError) {
      throw new Error(enrollError.message);
    }
  }

  if (payment.status !== "PAID") {
    const { error: payError } = await admin
      .from("payments")
      .update({ status: "PAID" })
      .eq("id", payment.id);
    if (payError) throw new Error(payError.message);
  }

  if (!enrollmentId || !userId) {
    throw new Error("Registration finalize incomplete.");
  }

  await admin
    .from("registration_intents")
    .update({
      status: "FULFILLED",
      fulfilled_user_id: userId,
      ...clearRegistrationPayloadFields(),
    })
    .eq("id", intent.id);

  await creditReferralReward(enrollmentId);

  return {
    ok: true,
    paymentId: payment.id,
    enrollmentId,
    userId,
    alreadyFulfilled: intent.status === "FULFILLED",
  };
}
