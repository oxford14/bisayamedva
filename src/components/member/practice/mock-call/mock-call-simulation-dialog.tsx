"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";

const STORAGE_KEY = "bisayamedva.mockCall.simulationReminderAck";

export function hasAcknowledgedMockCallSimulationReminder(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function acknowledgeMockCallSimulationReminder(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function MockCallSimulationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-amber-200/80 bg-amber-50 p-0 shadow-lg backdrop:bg-navy/40"
      aria-labelledby="mock-call-simulation-dialog-title"
      onClose={onClose}
      onCancel={(e) => e.preventDefault()}
    >
      <div className="px-5 py-4">
        <h2
          id="mock-call-simulation-dialog-title"
          className="font-display text-lg font-semibold text-ink"
        >
          {practiceCopy.mockCallSimulationDialogTitle}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy/90">
          {practiceCopy.mockCallSimulationDialogBody}
        </p>
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="accent"
            onClick={() => {
              acknowledgeMockCallSimulationReminder();
              onClose();
            }}
          >
            {practiceCopy.mockCallSimulationDialogOk}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
