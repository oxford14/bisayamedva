"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestMemberWithdrawal } from "@/app/(member)/member/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withdrawCopy } from "@/content/site";
import { formatPeso } from "@/lib/utils";
import {
  MIN_WITHDRAWAL_PESOS,
  WITHDRAWAL_METHODS,
  WITHDRAWAL_PIN_LENGTH,
  type WithdrawalMethod,
} from "@/lib/wallet/withdraw-shared";

const METHOD_LABEL: Record<WithdrawalMethod, string> = {
  GCASH: withdrawCopy.gcash,
  MAYA: withdrawCopy.maya,
  BANK: withdrawCopy.bank,
};

export function WalletWithdrawPanel({
  balanceLabel,
  disabled,
  savedNumber,
  hasPin,
}: {
  balanceLabel: string;
  disabled?: boolean;
  savedNumber?: string | null;
  hasPin?: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("GCASH");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState(savedNumber ?? "");
  const [bankName, setBankName] = useState("");
  const [pin, setPin] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAccountNumber(savedNumber ?? "");
      setPin("");
      setError("");
    }
  }, [open, savedNumber]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function submit() {
    setError("");
    if (!hasPin) {
      setError(withdrawCopy.pinRequired);
      return;
    }
    const pesos = Number(amount);
    if (!Number.isFinite(pesos) || pesos < MIN_WITHDRAWAL_PESOS) {
      setError(withdrawCopy.minAmount);
      return;
    }
    if (pin.length !== WITHDRAWAL_PIN_LENGTH) {
      setError(withdrawCopy.pinInvalid);
      return;
    }

    startTransition(async () => {
      const result = await requestMemberWithdrawal({
        amountPesos: pesos,
        method,
        accountName,
        accountNumber,
        bankName,
        pin,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAmount("");
      setAccountName("");
      setAccountNumber(savedNumber ?? "");
      setBankName("");
      setPin("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {withdrawCopy.button}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl border border-border bg-white p-5 shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
            <h2
              id={titleId}
              className="font-display text-2xl font-semibold text-ink"
            >
              {withdrawCopy.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{withdrawCopy.body}</p>
            <p className="mt-1 text-sm text-muted">
              Available balance: {balanceLabel}
            </p>

            <div className="mt-4">
              <label
                htmlFor="withdraw_amount"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
              >
                {withdrawCopy.amountLabel}
              </label>
              <Input
                id="withdraw_amount"
                type="number"
                min={MIN_WITHDRAWAL_PESOS}
                step={1}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                {withdrawCopy.methodLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {WITHDRAWAL_METHODS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      method === value
                        ? "border-teal bg-teal-bright/15 text-navy"
                        : "border-border bg-cream/70 text-ink hover:border-navy/30"
                    }`}
                    onClick={() => setMethod(value)}
                  >
                    {METHOD_LABEL[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="withdraw_account_name"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
              >
                {withdrawCopy.accountName}
              </label>
              <Input
                id="withdraw_account_name"
                value={accountName}
                autoComplete="name"
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="withdraw_account_number"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
              >
                {withdrawCopy.accountNumber}
              </label>
              <Input
                id="withdraw_account_number"
                value={accountNumber}
                inputMode="numeric"
                autoComplete="off"
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            {method === "BANK" ? (
              <div className="mt-4">
                <label
                  htmlFor="withdraw_bank_name"
                  className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
                >
                  {withdrawCopy.bankName}
                </label>
                <Input
                  id="withdraw_bank_name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            ) : null}

            <div className="mt-4">
              <label
                htmlFor="withdraw_pin"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
              >
                {withdrawCopy.pinLabel}
              </label>
              <Input
                id="withdraw_pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={WITHDRAWAL_PIN_LENGTH}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={!hasPin}
              />
              {!hasPin ? (
                <p className="mt-1.5 text-xs text-muted">
                  {withdrawCopy.pinRequired}{" "}
                  <Link href="/member/profile" className="font-medium text-teal hover:text-navy">
                    Open Profile
                  </Link>
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="accent"
                className="flex-1"
                disabled={pending}
                onClick={submit}
              >
                {pending ? withdrawCopy.submitting : withdrawCopy.submit}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={pending}
                onClick={close}
              >
                {withdrawCopy.close}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Minimum {formatPeso(MIN_WITHDRAWAL_PESOS)}. Admin sends the payout
              after approval.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
