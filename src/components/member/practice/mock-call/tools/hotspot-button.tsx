"use client";

import { cn } from "@/lib/utils";

export function HotspotButton({
  children,
  done,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  done: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-[box-shadow,transform,border-color]",
        done
          ? "border-teal-bright/50 bg-teal-bright/20 text-navy"
          : "border-border bg-white/80 text-ink hover:border-navy/20 hover:bg-sand/30",
        className,
      )}
    >
      {children}
    </button>
  );
}
