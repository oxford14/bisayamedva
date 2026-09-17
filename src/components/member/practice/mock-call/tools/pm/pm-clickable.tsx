"use client";

import { cn } from "@/lib/utils";

/** Dense PM-style control; no pulse — progress shown in guide checklist only. */
export function PmClickable({
  children,
  done,
  onClick,
  className,
  variant = "button",
}: {
  children: React.ReactNode;
  done?: boolean;
  onClick: () => void;
  className?: string;
  variant?: "button" | "row" | "tab" | "link";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left text-xs font-medium transition-colors",
        variant === "button" &&
          "rounded-md border px-2.5 py-1.5 border-border bg-white text-ink hover:bg-sand/50",
        variant === "row" &&
          "w-full border-b border-border/80 px-2 py-2 hover:bg-sand/40",
        variant === "tab" &&
          "rounded-t-md border border-b-0 border-border px-3 py-1.5 bg-white text-ink",
        variant === "link" &&
          "text-navy underline-offset-2 hover:underline",
        done && "border-teal-bright/40 bg-teal-bright/10",
        className,
      )}
    >
      {children}
    </button>
  );
}
