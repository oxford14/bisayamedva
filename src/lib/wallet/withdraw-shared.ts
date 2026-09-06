export const MIN_WITHDRAWAL_PESOS = 200;
export const WITHDRAWAL_PIN_LENGTH = 6;

export const WITHDRAWAL_METHODS = ["GCASH", "MAYA", "BANK"] as const;
export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];

export const WITHDRAWAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export type WalletWithdrawal = {
  id: string;
  student_id: string;
  amount: number;
  method: WithdrawalMethod;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  status: WithdrawalStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};
