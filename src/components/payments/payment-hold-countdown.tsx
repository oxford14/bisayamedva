"use client";

import { useEffect, useRef, useState } from "react";
import { authCopy } from "@/content/site";

function remainingMs(expiresAt: string) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function PaymentHoldCountdown({
  expiresAt,
  onExpired,
}: {
  expiresAt: string;
  onExpired?: () => void;
}) {
  const [left, setLeft] = useState(() => remainingMs(expiresAt));
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const initial = remainingMs(expiresAt);
    setLeft(initial);
    if (initial <= 0) {
      onExpiredRef.current?.();
      return;
    }
    const timer = window.setInterval(() => {
      const next = remainingMs(expiresAt);
      setLeft(next);
      if (next <= 0) {
        window.clearInterval(timer);
        onExpiredRef.current?.();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (left <= 0) {
    return (
      <p className="mt-3 text-center text-xs font-medium text-destructive">
        {authCopy.checkout.expired}
      </p>
    );
  }

  return (
    <p className="mt-3 text-center text-xs text-muted">
      {authCopy.checkout.expiry}{" "}
      <span className="font-semibold text-navy">{formatRemaining(left)}</span>{" "}
      remaining.
    </p>
  );
}
