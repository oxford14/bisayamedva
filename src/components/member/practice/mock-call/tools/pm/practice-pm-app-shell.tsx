"use client";

import type { ReactNode } from "react";
import { PmNavItem } from "@/components/member/practice/mock-call/tools/pm/pm-nav-item";
import {
  PM_APP_NAME,
  pmNavModules,
  type PmNavModuleId,
} from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";

export function PracticePmAppShell({
  activeNav,
  breadcrumb,
  toolbar,
  onNavClick,
  navDoneIds,
  onDecoy,
  children,
}: {
  activeNav: PmNavModuleId;
  breadcrumb: string[];
  toolbar?: ReactNode;
  onNavClick: (navId: PmNavModuleId) => void;
  /** nav module ids completed (visual only) */
  navDoneIds?: Set<string>;
  onDecoy: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-navy/20 bg-[#e8ecf0] shadow-inner">
      <div className="flex items-center gap-2 border-b border-navy/15 bg-[#dfe4ea] px-3 py-2">
        <span className="size-2 rounded-full bg-red-400/80" aria-hidden />
        <span className="size-2 rounded-full bg-amber-400/80" aria-hidden />
        <span className="size-2 rounded-full bg-teal-bright/80" aria-hidden />
        <span className="ml-2 truncate text-[11px] font-semibold text-navy">
          {PM_APP_NAME}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <PmClickable variant="link" className="text-[10px] no-underline" onClick={onDecoy}>
            Alerts (3)
          </PmClickable>
          <div className="relative">
            <PmClickable
              variant="button"
              className="py-1 text-[10px]"
              onClick={onDecoy}
            >
              VA User ▾
            </PmClickable>
          </div>
        </span>
      </div>

      <div className="flex min-h-[360px]">
        <nav
          className="flex w-[118px] shrink-0 flex-col gap-0.5 border-r border-navy/10 bg-[#d4dae2] p-2"
          aria-label="Main modules"
        >
          {pmNavModules.map((mod) => (
            <PmNavItem
              key={mod.id}
              label={mod.label}
              active={activeNav === mod.id}
              done={navDoneIds?.has(mod.id)}
              onClick={() => onNavClick(mod.id)}
            />
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col bg-[#f4f6f8]">
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-3 py-2">
            <p className="text-[11px] text-navy/70">
              {breadcrumb.join(" › ")}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {toolbar}
              <PmClickable variant="button" className="text-[10px]" onClick={onDecoy}>
                Export
              </PmClickable>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
