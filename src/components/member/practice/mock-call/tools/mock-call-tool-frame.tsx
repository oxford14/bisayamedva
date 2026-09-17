"use client";

import type { ReactNode } from "react";

export function MockCallToolFrame({
  windowTitle,
  children,
}: {
  windowTitle: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-navy/20 bg-[#f4f6f8] shadow-inner">
      <div className="flex items-center gap-2 border-b border-navy/10 bg-navy/5 px-3 py-2">
        <span className="size-2 rounded-full bg-red-400/80" aria-hidden />
        <span className="size-2 rounded-full bg-amber-400/80" aria-hidden />
        <span className="size-2 rounded-full bg-teal-bright/80" aria-hidden />
        <span className="ml-2 truncate text-[11px] font-medium text-navy/70">
          {windowTitle}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
