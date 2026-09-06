import { createServiceClient } from "@/lib/supabase/admin";
import {
  creditWallet,
  debitWallet,
  getOrCreateWallet,
} from "@/lib/wallet/ledger";
import {
  MIN_WITHDRAWAL_PESOS,
  WITHDRAWAL_METHODS,
  WITHDRAWAL_STATUSES,
  type WalletWithdrawal,
  type WithdrawalMethod,
  type WithdrawalStatus,
} from "@/lib/wallet/withdraw-shared";

export {
  MIN_WITHDRAWAL_PESOS,
  WITHDRAWAL_METHODS,
  WITHDRAWAL_STATUSES,
  type WithdrawalMethod,
  type WithdrawalStatus,
  type WalletWithdrawal,
};

export type AdminWithdrawalRow = WalletWithdrawal & {
  student_name: string | null;
  student_email: string | null;
};

type ActionResult = { ok: true } | { ok: false; error: string };

function mapWithdrawal(row: {
  id: string;
  student_id: string;
  amount: number | string;
  method: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  status: string;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}): WalletWithdrawal {
  return {
    id: row.id,
    student_id: row.student_id,
    amount: Number(row.amount),
    method: row.method as WithdrawalMethod,
    account_name: row.account_name,
    account_number: row.account_number,
    bank_name: row.bank_name,
    status: row.status as WithdrawalStatus,
    review_note: row.review_note,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
  };
}

function normalizePesos(amountPesos: number) {
  return Math.round(amountPesos * 100) / 100;
}

export async function listStudentWithdrawals(
  studentId: string,
  limit = 20,
): Promise<WalletWithdrawal[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("wallet_withdrawals")
    .select(
      "id, student_id, amount, method, account_name, account_number, bank_name, status, review_note, reviewed_by, reviewed_at, created_at",
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listStudentWithdrawals", error.message);
    return [];
  }

  return (data ?? []).map(mapWithdrawal);
}

export async function listAdminWithdrawals(status?: string): Promise<
  AdminWithdrawalRow[]
> {
  const admin = createServiceClient();
  let query = admin
    .from("wallet_withdrawals")
    .select(
      "id, student_id, amount, method, account_name, account_number, bank_name, status, review_note, reviewed_by, reviewed_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && WITHDRAWAL_STATUSES.includes(status as WithdrawalStatus)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listAdminWithdrawals", error.message);
    return [];
  }

  const rows = (data ?? []).map(mapWithdrawal);
  const studentIds = [...new Set(rows.map((row) => row.student_id))];
  const profiles = new Map<string, { full_name: string | null; email: string | null }>();

  if (studentIds.length > 0) {
    const { data: people } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    for (const person of people ?? []) {
      profiles.set(person.id as string, {
        full_name: (person.full_name as string | null) ?? null,
        email: (person.email as string | null) ?? null,
      });
    }
  }

  return rows.map((row) => {
    const student = profiles.get(row.student_id);
    return {
      ...row,
      student_name: student?.full_name ?? null,
      student_email: student?.email ?? null,
    };
  });
}

export async function requestWithdrawal(input: {
  studentId: string;
  amountPesos: number;
  method: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  pin: string;
}): Promise<ActionResult> {
  const { verifyStudentWithdrawalPin } = await import(
    "@/lib/wallet/withdrawal-settings"
  );
  const pinCheck = await verifyStudentWithdrawalPin(input.studentId, input.pin);
  if (!pinCheck.ok) return pinCheck;

  const amount = normalizePesos(input.amountPesos);
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_PESOS) {
    return { ok: false, error: `Minimum withdrawal is ₱${MIN_WITHDRAWAL_PESOS}.` };
  }

  if (!WITHDRAWAL_METHODS.includes(input.method as WithdrawalMethod)) {
    return { ok: false, error: "Choose GCash, Maya, or bank transfer." };
  }

  const accountName = input.accountName.trim();
  const accountNumber = input.accountNumber.replace(/\s+/g, "").trim();
  const bankName = input.bankName?.trim() ?? "";

  if (accountName.length < 2) {
    return { ok: false, error: "Please enter the account name." };
  }
  if (accountNumber.length < 6) {
    return { ok: false, error: "Please enter a valid account number or mobile." };
  }
  if (input.method === "BANK" && bankName.length < 2) {
    return { ok: false, error: "Please enter the bank name." };
  }

  const admin = createServiceClient();
  const wallet = await getOrCreateWallet(input.studentId);
  if (wallet.balance < amount) {
    return { ok: false, error: "Kulang imong wallet balance for this amount." };
  }

  const { data: pending } = await admin
    .from("wallet_withdrawals")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("status", "PENDING")
    .maybeSingle();

  if (pending) {
    return {
      ok: false,
      error: "Naa na kay pending withdrawal. Wait for admin review, or cancel it first.",
    };
  }

  const { data: created, error: insertError } = await admin
    .from("wallet_withdrawals")
    .insert({
      student_id: input.studentId,
      amount,
      method: input.method,
      account_name: accountName,
      account_number: accountNumber,
      bank_name: input.method === "BANK" ? bankName : null,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (insertError || !created) {
    if (insertError?.code === "23505") {
      return {
        ok: false,
        error: "Naa na kay pending withdrawal. Wait for admin review, or cancel it first.",
      };
    }
    return { ok: false, error: insertError?.message ?? "Could not create withdrawal." };
  }

  const debit = await debitWallet({
    studentId: input.studentId,
    amount,
    type: "WITHDRAWAL",
    referenceType: "wallet_withdrawal",
    referenceId: created.id,
    note: `${input.method} withdrawal request`,
  });

  if (!debit.ok) {
    await admin.from("wallet_withdrawals").delete().eq("id", created.id);
    return { ok: false, error: debit.error };
  }

  const { error: holdError } = await admin
    .from("wallet_withdrawals")
    .update({ hold_txn_id: debit.transactionId, updated_at: new Date().toISOString() })
    .eq("id", created.id);

  if (holdError) {
    console.error("requestWithdrawal hold_txn", holdError.message);
  }

  return { ok: true };
}

async function releaseHeldWithdrawal(input: {
  withdrawalId: string;
  studentId: string;
  amount: number;
  nextStatus: Extract<WithdrawalStatus, "REJECTED" | "CANCELLED">;
  reviewNote?: string | null;
  reviewedBy?: string | null;
}): Promise<ActionResult> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from("wallet_withdrawals")
    .update({
      status: input.nextStatus,
      review_note: input.reviewNote ?? null,
      reviewed_by: input.reviewedBy ?? null,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", input.withdrawalId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: updateError.message };
  }
  if (!updated) {
    return { ok: false, error: "This withdrawal is no longer pending." };
  }

  const credit = await creditWallet({
    studentId: input.studentId,
    amount: input.amount,
    type: "WITHDRAWAL_REFUND",
    referenceType: "wallet_withdrawal",
    referenceId: input.withdrawalId,
    note:
      input.nextStatus === "CANCELLED"
        ? "Withdrawal cancelled"
        : "Withdrawal rejected — returned to wallet",
  });

  if (!credit.ok) {
    await admin
      .from("wallet_withdrawals")
      .update({
        status: "PENDING",
        review_note: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: now,
      })
      .eq("id", input.withdrawalId);
    return { ok: false, error: credit.error };
  }

  await admin
    .from("wallet_withdrawals")
    .update({ refund_txn_id: credit.transactionId, updated_at: now })
    .eq("id", input.withdrawalId);

  return { ok: true };
}

export async function cancelWithdrawal(input: {
  studentId: string;
  withdrawalId: string;
}): Promise<ActionResult> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("wallet_withdrawals")
    .select("id, student_id, amount, status")
    .eq("id", input.withdrawalId)
    .maybeSingle();

  if (error || !data || data.student_id !== input.studentId) {
    return { ok: false, error: "Withdrawal not found." };
  }
  if (data.status !== "PENDING") {
    return { ok: false, error: "Only a pending withdrawal can be cancelled." };
  }

  return releaseHeldWithdrawal({
    withdrawalId: data.id,
    studentId: data.student_id,
    amount: Number(data.amount),
    nextStatus: "CANCELLED",
    reviewNote: "Cancelled by student",
    reviewedBy: input.studentId,
  });
}

export async function reviewWithdrawal(input: {
  adminId: string;
  withdrawalId: string;
  decision: "APPROVED" | "REJECTED";
  reviewNote?: string;
}): Promise<ActionResult> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("wallet_withdrawals")
    .select("id, student_id, amount, status")
    .eq("id", input.withdrawalId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Withdrawal not found." };
  }
  if (data.status !== "PENDING") {
    return { ok: false, error: "This withdrawal is no longer pending." };
  }

  const note = input.reviewNote?.trim() || null;

  if (input.decision === "REJECTED") {
    return releaseHeldWithdrawal({
      withdrawalId: data.id,
      studentId: data.student_id,
      amount: Number(data.amount),
      nextStatus: "REJECTED",
      reviewNote: note,
      reviewedBy: input.adminId,
    });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("wallet_withdrawals")
    .update({
      status: "APPROVED",
      review_note: note,
      reviewed_by: input.adminId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", data.id)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: updateError.message };
  }
  if (!updated) {
    return { ok: false, error: "This withdrawal is no longer pending." };
  }

  return { ok: true };
}
