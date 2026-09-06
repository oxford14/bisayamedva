import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";

export type WalletTxnType =
  | "TOP_UP"
  | "ENROLL_SPEND"
  | "SESSION_REFUND"
  | "ADMIN_ADJUST"
  | "REFERRAL_EARNINGS"
  | "WITHDRAWAL"
  | "WITHDRAWAL_REFUND";

export type WalletRow = {
  student_id: string;
  balance: number;
  currency: string;
};

export type WalletTransaction = {
  id: string;
  student_id: string;
  type: WalletTxnType;
  amount: number;
  direction: "credit" | "debit";
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_at: string;
};

export type LedgerResult =
  | { ok: true; balance: number; transactionId: string }
  | { ok: false; error: string };

async function applyTxn(input: {
  studentId: string;
  type: WalletTxnType;
  amount: number;
  direction: "credit" | "debit";
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
}): Promise<LedgerResult> {
  if (!(input.amount > 0)) {
    return { ok: false, error: "Amount must be positive." };
  }

  const admin = createServiceClient();
  const { data, error } = await admin.rpc("wallet_apply_txn", {
    p_student_id: input.studentId,
    p_type: input.type,
    p_amount: input.amount,
    p_direction: input.direction,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_note: input.note ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.transaction_id) {
    return { ok: false, error: "Wallet transaction failed." };
  }

  return {
    ok: true,
    balance: Number(row.balance),
    transactionId: row.transaction_id as string,
  };
}

export async function getOrCreateWallet(studentId: string): Promise<WalletRow> {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("wallets")
    .select("student_id, balance, currency")
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    return {
      student_id: existing.student_id,
      balance: Number(existing.balance),
      currency: existing.currency || "PHP",
    };
  }

  const { data: created, error } = await admin
    .from("wallets")
    .insert({ student_id: studentId, balance: 0, currency: "PHP" })
    .select("student_id, balance, currency")
    .single();

  if (error || !created) {
    // Race: another request created it
    const { data: again } = await admin
      .from("wallets")
      .select("student_id, balance, currency")
      .eq("student_id", studentId)
      .maybeSingle();
    if (again) {
      return {
        student_id: again.student_id,
        balance: Number(again.balance),
        currency: again.currency || "PHP",
      };
    }
    throw new Error(error?.message ?? "Could not create wallet.");
  }

  return {
    student_id: created.student_id,
    balance: Number(created.balance),
    currency: created.currency || "PHP",
  };
}

export async function creditWallet(input: {
  studentId: string;
  amount: number;
  type: Extract<
    WalletTxnType,
    | "TOP_UP"
    | "SESSION_REFUND"
    | "ADMIN_ADJUST"
    | "REFERRAL_EARNINGS"
    | "WITHDRAWAL_REFUND"
  >;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
}): Promise<LedgerResult> {
  await getOrCreateWallet(input.studentId);
  return applyTxn({
    studentId: input.studentId,
    type: input.type,
    amount: input.amount,
    direction: "credit",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    note: input.note,
  });
}

export async function debitWallet(input: {
  studentId: string;
  amount: number;
  type: Extract<WalletTxnType, "ENROLL_SPEND" | "ADMIN_ADJUST" | "WITHDRAWAL">;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
}): Promise<LedgerResult> {
  await getOrCreateWallet(input.studentId);
  return applyTxn({
    studentId: input.studentId,
    type: input.type,
    amount: input.amount,
    direction: "debit",
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    note: input.note,
  });
}

export async function getWalletTransactions(
  studentId: string,
  limit = 40,
): Promise<WalletTransaction[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("wallet_transactions")
    .select(
      "id, student_id, type, amount, direction, balance_after, reference_type, reference_id, note, created_at",
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getWalletTransactions", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    student_id: row.student_id as string,
    type: row.type as WalletTxnType,
    amount: Number(row.amount),
    direction: row.direction as "credit" | "debit",
    balance_after: Number(row.balance_after),
    reference_type: (row.reference_type as string | null) ?? null,
    reference_id: (row.reference_id as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

export function walletTxnLabel(txn: WalletTransaction) {
  switch (txn.type) {
    case "TOP_UP":
      return "Wallet top-up";
    case "ENROLL_SPEND":
      return "Course enrollment";
    case "SESSION_REFUND":
      return "Schedule refund credit";
    case "ADMIN_ADJUST":
      return "Admin adjustment";
    case "REFERRAL_EARNINGS":
      return "Referral earnings";
    case "WITHDRAWAL":
      return "Withdrawal";
    case "WITHDRAWAL_REFUND":
      return "Withdrawal returned";
    default:
      return txn.type;
  }
}

export function formatWalletAmount(txn: WalletTransaction) {
  const label = formatPeso(txn.amount);
  return txn.direction === "credit" ? `+${label}` : `−${label}`;
}
