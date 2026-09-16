"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { practiceCopy } from "@/content/site";
import { PRACTICE_PROVIDERS } from "@/lib/practice/constants";
import { weekNumber } from "@/lib/practice/scheduling-calendar";
import { cn } from "@/lib/utils";

export type SchedulingView = "week" | "day";

export function SchedulingToolbar({
  anchorDate,
  view,
  providerFilter,
  onToday,
  onPrev,
  onNext,
  onJumpPrev,
  onJumpNext,
  onViewChange,
  onProviderChange,
}: {
  anchorDate: Date;
  view: SchedulingView;
  providerFilter: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpPrev: () => void;
  onJumpNext: () => void;
  onViewChange: (view: SchedulingView) => void;
  onProviderChange: (provider: string) => void;
}) {
  return (
    <div className="rounded-t-xl bg-navy px-3 py-2.5 text-white sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase hover:bg-white/25"
          >
            {practiceCopy.schedulingToday}
          </button>
          <div className="flex items-center gap-0.5">
            <IconBtn label="Previous month" onClick={onJumpPrev}>
              <ChevronsLeft className="size-4" />
            </IconBtn>
            <IconBtn label="Previous" onClick={onPrev}>
              <ChevronLeft className="size-4" />
            </IconBtn>
            <span className="min-w-[5.5rem] px-2 text-center text-sm font-semibold">
              {practiceCopy.schedulingWeekLabel} {weekNumber(anchorDate)}
            </span>
            <IconBtn label="Next" onClick={onNext}>
              <ChevronRight className="size-4" />
            </IconBtn>
            <IconBtn label="Next month" onClick={onJumpNext}>
              <ChevronsRight className="size-4" />
            </IconBtn>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <span className="font-semibold tracking-wide uppercase opacity-90">
              {practiceCopy.schedulingPractitioner}
            </span>
            <select
              value={providerFilter}
              onChange={(e) => onProviderChange(e.target.value)}
              className="h-9 min-w-[10rem] rounded-md border-0 bg-white/15 px-2 text-sm text-white [&>option]:text-ink"
            >
              <option value="">{practiceCopy.schedulingAllProviders}</option>
              {PRACTICE_PROVIDERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-md bg-white/10 p-0.5 text-xs font-semibold">
            {(["day", "week"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewChange(mode)}
                className={cn(
                  "rounded px-3 py-1.5 capitalize",
                  view === mode
                    ? "bg-white text-navy"
                    : "text-white/90 hover:bg-white/10",
                )}
              >
                {mode === "day"
                  ? practiceCopy.schedulingDay
                  : practiceCopy.schedulingWeek}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded p-1 hover:bg-white/15"
    >
      {children}
    </button>
  );
}
