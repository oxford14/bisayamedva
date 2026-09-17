"use client";

import { cn } from "@/lib/utils";

export function PmTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: {
    id: string;
    cells: string[];
    done?: boolean;
    onClick: () => void;
  }[];
}) {
  const cols = columns.length;
  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      <div
        className="sticky top-0 grid border-b border-border bg-[#eef1f4] text-[10px] font-semibold uppercase tracking-wide text-navy/70"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {columns.map((col) => (
          <div key={col} className="px-2 py-1.5">
            {col}
          </div>
        ))}
      </div>
      <div className="max-h-36 overflow-y-auto">
        {rows.map((row, i) => (
          <button
            key={row.id}
            type="button"
            onClick={row.onClick}
            className={cn(
              "grid w-full border-b border-border/60 px-0 py-0 text-left text-[11px] font-normal text-ink transition-colors hover:bg-sand/40",
              i % 2 === 1 && "bg-sand/20",
              row.done && "bg-teal-bright/10",
            )}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {row.cells.map((cell, j) => (
              <span key={j} className="truncate px-2 py-2">
                {cell}
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}
