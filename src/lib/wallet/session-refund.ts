import { createServiceClient } from "@/lib/supabase/admin";
import { creditWallet } from "@/lib/wallet/ledger";

export type SessionRefundResult =
  | {
      ok: true;
      archived: boolean;
      refundedCount: number;
      cancelledPendingCount: number;
    }
  | { ok: false; error: string };

/**
 * Refund ACTIVE/COMPLETED (and PAID) seats to wallet, cancel PENDING_PAYMENT,
 * then archive the session. Blocks if called without confirm when seats exist —
 * caller should always intend refund.
 */
export async function refundSessionSeatsAndArchive(
  sessionId: string,
): Promise<SessionRefundResult> {
  const admin = createServiceClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, title, course_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return { ok: false, error: "Session not found." };
  }

  if (session.status === "ARCHIVED") {
    return {
      ok: true,
      archived: true,
      refundedCount: 0,
      cancelledPendingCount: 0,
    };
  }

  const { data: enrollments, error } = await admin
    .from("enrollments")
    .select(
      `
      id,
      status,
      student_id,
      course_id,
      payments (
        id,
        amount,
        status
      )
    `,
    )
    .eq("session_id", sessionId)
    .neq("status", "CANCELLED");

  if (error) {
    return { ok: false, error: error.message };
  }

  let refundedCount = 0;
  let cancelledPendingCount = 0;

  for (const row of enrollments ?? []) {
    const payments = row.payments as
      | { id: string; amount: number; status: string }
      | { id: string; amount: number; status: string }[]
      | null;
    const paymentList = !payments
      ? []
      : Array.isArray(payments)
        ? payments
        : [payments];
    const paid =
      paymentList.find((p) => p.status === "PAID") ?? paymentList[0] ?? null;

    const seated =
      row.status === "ACTIVE" ||
      row.status === "COMPLETED" ||
      paid?.status === "PAID";

    if (seated) {
      const { data: course } = await admin
        .from("courses")
        .select("price, title")
        .eq("id", row.course_id)
        .maybeSingle();

      const amount = Number(paid?.amount ?? course?.price ?? 0);
      if (amount > 0) {
        const credit = await creditWallet({
          studentId: row.student_id,
          amount,
          type: "SESSION_REFUND",
          referenceType: "session",
          referenceId: sessionId,
          note: `Refund · ${session.title} cancelled`,
        });
        if (!credit.ok) {
          return {
            ok: false,
            error: `Could not refund seat ${row.id}: ${credit.error}`,
          };
        }
        refundedCount += 1;
      }

      if (paid && paid.status === "PAID") {
        await admin
          .from("payments")
          .update({ status: "REFUNDED" })
          .eq("id", paid.id);
      }
    } else {
      cancelledPendingCount += 1;
    }

    await admin
      .from("enrollments")
      .update({ status: "CANCELLED" })
      .eq("id", row.id);
  }

  const { error: archiveError } = await admin
    .from("sessions")
    .update({ status: "ARCHIVED" })
    .eq("id", sessionId);

  if (archiveError) {
    return { ok: false, error: archiveError.message };
  }

  return {
    ok: true,
    archived: true,
    refundedCount,
    cancelledPendingCount,
  };
}

export async function countActiveSessionSeats(sessionId: string) {
  const admin = createServiceClient();
  const { count, error } = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .neq("status", "CANCELLED");

  if (error) {
    console.error("countActiveSessionSeats", error.message);
    return 0;
  }
  return count ?? 0;
}
