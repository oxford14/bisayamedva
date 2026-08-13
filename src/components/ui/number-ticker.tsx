"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type NumberTickerProps = {
  value: number;
  className?: string;
  prefix?: string;
};

export function NumberTicker({
  value,
  className,
  prefix = "",
}: NumberTickerProps) {
  const [display, setDisplay] = useState(value);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced.current) {
      setDisplay(value);
      return;
    }

    const start = 0;
    const duration = 900;
    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {display.toLocaleString("en-PH")}
    </span>
  );
}
