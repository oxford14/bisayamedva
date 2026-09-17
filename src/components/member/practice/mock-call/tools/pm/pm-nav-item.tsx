"use client";

import { cn } from "@/lib/utils";

export function PmNavItem({
  label,
  active,
  done,
  onClick,
}: {
  label: string;
  active?: boolean;
  done?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors",
        active
          ? "bg-navy text-white"
          : "text-navy/80 hover:bg-white/80",
        done && !active && "border border-teal-bright/30 bg-teal-bright/10",
      )}
    >
      {label}
    </button>
  );
}
