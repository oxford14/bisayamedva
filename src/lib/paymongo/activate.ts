import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";

export type ActivateResult = {
  ok: true;
  paymentId: string;
  enrollmentId: string;
  alreadyActive: boolean;
};

function revalidatePaymentPaths() {
  revalidatePath("/member");
  revalidatePath("/member/payments");
  revalidatePath("/member/course");
  revalidatePath("/member/schedule");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/enrollments");
}

/**
 * Marks a payment PAID and its enrollment ACTIVE.
 * Idempotent when already paid/active.
 */
export async function activatePaidEnrollment(input: {
  paymentId?: string | null;
  providerPaymentId?: string | null;
}): Promise<ActivateResult> {
  const admin = createServiceClient();

  let payment:
    | {
        id: string;
        status: string;
        enrollment_id: string;
        provider_payment_id: string | null;
      }
    | null = null;

  if (input.paymentId) {
    const { data } = await admin
      .from("payments")
      .select("id, status, enrollment_id, provider_payment_id")
      .eq("id", input.paymentId)
      .maybeSingle();
    payment = data;
  }

  if (!payment && input.providerPaymentId) {
    const { data } = await admin
      .from("payments")
      .select("id, status, enrollment_id, provider_payment_id")
      .eq("provider_payment_id", input.providerPaymentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    payment = data;
  }

  if (!payment) {
    throw new Error("Payment not found for activation.");
  }

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, status")
    .eq("id", payment.enrollment_id)
    .maybeSingle();

  if (!enrollment) {
    throw new Error("Enrollment not found for activation.");
  }

  if (payment.status === "PAID" && enrollment.status === "ACTIVE") {
    return {
      ok: true,
      paymentId: payment.id,
      enrollmentId: enrollment.id,
      alreadyActive: true,
    };
  }

  if (payment.status !== "PAID") {
    const { error: payError } = await admin
      .from("payments")
      .update({ status: "PAID" })
      .eq("id", payment.id);
    if (payError) throw new Error(payError.message);
  }

  if (enrollment.status !== "ACTIVE") {
    const { error: enrollError } = await admin
      .from("enrollments")
      .update({ status: "ACTIVE" })
      .eq("id", enrollment.id);
    if (enrollError) throw new Error(enrollError.message);
  }

  revalidatePaymentPaths();

  return {
    ok: true,
    paymentId: payment.id,
    enrollmentId: enrollment.id,
    alreadyActive: false,
  };
}
