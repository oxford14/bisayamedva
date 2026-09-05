import { createServiceClient } from "@/lib/supabase/admin";

export const PAYMENT_HOLD_MS = 10 * 60 * 1000;

export function pendingHoldExpiresAt(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + PAYMENT_HOLD_MS);
}

export function isPendingHoldFresh(
  createdAt: string | null | undefined,
  now = Date.now(),
) {
  if (!createdAt) return false;
  return pendingHoldExpiresAt(createdAt).getTime() > now;
}

/**
 * Cancels unpaid PENDING_PAYMENT holds older than 10 minutes so they
 * stop occupying session seats. Leaves paid/active enrollments alone.
 */
export async function expireStalePendingPayments() {
  const admin = createServiceClient();
  const cutoff = new Date(Date.now() - PAYMENT_HOLD_MS).toISOString();

  const { data: stale, error } = await admin
    .from("enrollments")
    .select("id")
    .eq("status", "PENDING_PAYMENT")
    .lt("created_at", cutoff);

  if (error) {
    console.error("expireStalePendingPayments", error.message);
    return;
  }

  const ids = (stale ?? []).map((row) => row.id);
  if (ids.length === 0) return;

  const { data: paid } = await admin
    .from("payments")
    .select("enrollment_id")
    .in("enrollment_id", ids)
    .eq("status", "PAID");

  const paidIds = new Set(
    (paid ?? []).map((row) => row.enrollment_id).filter(Boolean),
  );
  const expireIds = ids.filter((id) => !paidIds.has(id));
  if (expireIds.length === 0) return;

  const { error: enrollError } = await admin
    .from("enrollments")
    .update({ status: "CANCELLED" })
    .in("id", expireIds)
    .eq("status", "PENDING_PAYMENT");
  if (enrollError) {
    console.error("expireStalePendingPayments.enrollments", enrollError.message);
  }

  const { error: payError } = await admin
    .from("payments")
    .update({ status: "FAILED" })
    .in("enrollment_id", expireIds)
    .eq("status", "PENDING");
  if (payError) {
    console.error("expireStalePendingPayments.payments", payError.message);
  }
}
