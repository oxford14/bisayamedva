"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { creditMemberWallet } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import type { AdminMemberWalletRow } from "@/lib/wallet/admin";
import { formatPeso } from "@/lib/utils";

export function WalletCreditTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="accent" size="sm" onClick={onClick}>
      Add credit
    </Button>
  );
}

function WalletCreditSheetPanel({
  student,
  titleId,
  amount,
  setAmount,
  note,
  setNote,
  error,
  pending,
  onClose,
  onSubmit,
  variant,
}: {
  student: AdminMemberWalletRow;
  titleId: string;
  amount: string;
  setAmount: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  error: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  variant: "mobile" | "desktop";
}) {
  const isMobile = variant === "mobile";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={
        isMobile
          ? "w-full rounded-t-[1.35rem] border border-b-0 border-border bg-white shadow-[0_-18px_50px_rgba(47,56,38,0.2)]"
          : "w-full max-w-md rounded-2xl border border-border bg-white shadow-[0_24px_60px_rgba(47,56,38,0.18)]"
      }
      onClick={(event) => event.stopPropagation()}
    >
      {isMobile ? (
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-navy/20" aria-hidden />
        </div>
      ) : null}

      <div className={isMobile ? "border-b border-border px-5 py-4" : "border-b border-border px-5 py-4"}>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
          Wallet credit
        </p>
        <h2
          id={titleId}
          className="mt-1 font-display text-xl font-semibold text-ink"
        >
          {student.full_name ?? "Student"}
        </h2>
        <p className="mt-0.5 text-sm text-muted">{student.email ?? "—"}</p>
        <p className="mt-2 text-sm text-navy/80">
          Current balance:{" "}
          <span className="font-semibold text-ink">
            {formatPeso(student.balance)}
          </span>
        </p>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <label
            htmlFor={isMobile ? "wallet-credit-amount-mobile" : "wallet-credit-amount-desktop"}
            className="text-xs font-semibold text-navy/70"
          >
            Amount (₱)
          </label>
          <input
            id={isMobile ? "wallet-credit-amount-mobile" : "wallet-credit-amount-desktop"}
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 450"
            className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm"
            autoFocus={!isMobile}
          />
        </div>
        <div>
          <label
            htmlFor={isMobile ? "wallet-credit-note-mobile" : "wallet-credit-note-desktop"}
            className="text-xs font-semibold text-navy/70"
          >
            Note (optional)
          </label>
          <input
            id={isMobile ? "wallet-credit-note-mobile" : "wallet-credit-note-desktop"}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for credit"
            className="mt-1.5 h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div
          className={
            isMobile
              ? "flex flex-col gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              : "flex flex-wrap gap-2 pb-1"
          }
        >
          <Button
            type="button"
            variant="accent"
            disabled={pending || !amount}
            onClick={onSubmit}
            className={isMobile ? "w-full" : undefined}
          >
            {pending ? "Adding…" : "Add credit"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
            className={isMobile ? "w-full" : undefined}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WalletCreditSheet({
  student,
  onClose,
}: {
  student: AdminMemberWalletRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const mobileTitleId = `${titleId}-mobile`;
  const desktopTitleId = `${titleId}-desktop`;
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!student) return;
    setAmount("");
    setNote("");
    setError("");
  }, [student]);

  useEffect(() => {
    if (!student) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [student, onClose]);

  if (!student || !mounted) return null;

  function submit() {
    setError("");
    const formData = new FormData();
    formData.set("student_id", student!.student_id);
    formData.set("amount", amount);
    formData.set("note", note);

    startTransition(async () => {
      const result = await creditMemberWallet(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const panelProps = {
    student,
    amount,
    setAmount,
    note,
    setNote,
    error,
    pending,
    onClose,
    onSubmit: submit,
  };

  return createPortal(
    <>
      {/* Mobile: bottom sheet above admin tab bar */}
      <div
        className="fixed inset-0 z-[70] md:hidden"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-navy/45 backdrop-blur-[1px]"
          aria-label="Close wallet credit sheet"
          onClick={onClose}
        />
        <div
          className="absolute inset-x-0 bottom-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))]"
          onClick={(event) => event.stopPropagation()}
        >
          <WalletCreditSheetPanel
            {...panelProps}
            titleId={mobileTitleId}
            variant="mobile"
          />
        </div>
      </div>

      {/* Desktop: centered dialog */}
      <div
        className="fixed inset-0 z-50 hidden items-center justify-center bg-navy/45 p-4 md:flex"
        role="presentation"
        onClick={onClose}
      >
        <WalletCreditSheetPanel
          {...panelProps}
          titleId={desktopTitleId}
          variant="desktop"
        />
      </div>
    </>,
    document.body,
  );
}
