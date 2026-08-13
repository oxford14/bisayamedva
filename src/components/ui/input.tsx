import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5 text-base text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors placeholder:text-muted/70 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
