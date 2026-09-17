"use client";

import { useMemo, useState } from "react";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { cn } from "@/lib/utils";

/** Search field + result list for patient lookup steps */
export function PmPatientSearchList({
  results,
  completedIds,
  onHotspot,
  onDecoy,
  searchPlaceholder = "Search name or MRN…",
  hintName,
}: {
  results: { hotspotId: string; label: string; decoy?: boolean }[];
  nextClickId?: string | null;
  completedIds: Set<string>;
  onHotspot: (id: string) => void;
  onDecoy: () => void;
  searchPlaceholder?: string;
  /** Bisaya-English hint, e.g. caller name to search */
  hintName?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => r.label.toLowerCase().includes(q));
  }, [query, results]);

  return (
    <div className="space-y-2 rounded-md border border-border bg-white p-2">
      <p className="text-[10px] font-semibold uppercase text-navy/60">
        Patient search
      </p>
      {hintName ? (
        <p className="text-[10px] text-muted">
          Type <strong className="text-ink">{hintName}</strong> sa search box,
          then click the matching row.
        </p>
      ) : null}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="h-8 w-full rounded-md border border-border bg-[#fafbfc] px-2 text-xs text-ink placeholder:text-muted"
        autoComplete="off"
      />
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase text-navy/50">
          Results
        </p>
        {filtered.length === 0 ? (
          <p className="py-2 text-xs text-muted">No matches — try another spelling.</p>
        ) : (
          filtered.map((r) => (
            <PmClickable
              key={r.label}
              variant="button"
              done={completedIds.has(r.hotspotId)}
              className={cn("w-full")}
              onClick={() => {
                if (r.decoy) {
                  onDecoy();
                  return;
                }
                onHotspot(r.hotspotId);
              }}
            >
              {r.label}
            </PmClickable>
          ))
        )}
      </div>
    </div>
  );
}
