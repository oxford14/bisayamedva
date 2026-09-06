"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMemberWithdrawal } from "@/app/(member)/member/actions";
import { StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { withdrawCopy } from "@/content/site";
import { formatPeso } from "@/lib/utils";
import type {
  WalletWithdrawal,
  WithdrawalMethod,
} from "@/lib/wallet/withdraw-shared";

const METHOD_LABEL: Record<WithdrawalMethod, string> = {
  GCASH: withdrawCopy.gcash,
  MAYA: withdrawCopy.maya,
  BANK: withdrawCopy.bank,
};

export function WalletWithdrawList({
  withdrawals,
}: {
  withdrawals: WalletWithdrawal[];
}) {
  const pending = withdrawals.find((row) => row.status === "PENDING");

  return (
    <div className="space-y-3">
      {pending ? <PendingWithdrawalCard withdrawal={pending} /> : null}
      {withdrawals.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">{withdrawCopy.emptyList}</p>
      ) : (
        <ul className="divide-y divide-border/70">
          {withdrawals.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {formatPeso(row.amount)} · {METHOD_LABEL[row.method]}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {row.account_name} · {row.account_number}
                  {row.bank_name ? ` · ${row.bank_name}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {new Date(row.created_at).toLocaleString("en-PH")}
                  {row.review_note && row.status !== "PENDING"
                    ? ` · ${row.review_note}`
                    : ""}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PendingWithdrawalCard({
  withdrawal,
}: {
  withdrawal: WalletWithdrawal;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function cancel() {
    setError("");
    startTransition(async () => {
      const result = await cancelMemberWithdrawal(withdrawal.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-5 rounded-2xl border border-teal/30 bg-teal-bright/10 px-4 py-4">
      <p className="text-sm font-semibold text-navy">{withdrawCopy.pendingTitle}</p>
      <p className="mt-1 text-sm text-muted">{withdrawCopy.pendingBody}</p>
      <p className="mt-2 text-sm font-medium text-ink">
        {formatPeso(withdrawal.amount)} · {METHOD_LABEL[withdrawal.method]}
      </p>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={cancel}
      >
        {pending ? withdrawCopy.cancelling : withdrawCopy.cancel}
      </Button>
    </div>
  );
}
