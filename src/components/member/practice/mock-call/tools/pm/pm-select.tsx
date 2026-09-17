"use client";

import { cn } from "@/lib/utils";

export function PmSelect({
  label,
  options,
  value,
  onChange,
  onDecoyChange,
  className,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  /** When set, only this value is valid; others call onDecoyChange */
  onDecoyChange?: () => void;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-0.5 text-[10px] text-navy/70", className)}>
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <select
        className="h-8 rounded-md border border-border bg-white px-2 text-xs text-ink"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (onChange) {
            onChange(v);
          } else if (onDecoyChange) {
            onDecoyChange();
          }
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
