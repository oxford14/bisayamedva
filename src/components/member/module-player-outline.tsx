"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Flag, Lock, X } from "lucide-react";
import { modulesCopy } from "@/content/site";
import { ModuleArt } from "@/components/member/module-art";
import { cn } from "@/lib/utils";
import type {
  PlayerOutlineItem,
  PlayerOutlineModule,
} from "@/lib/member/module-player-shared";

export function ModulePlayerOutline({
  courseSlug,
  courseTitle,
  closeHref,
  outline,
  activeKey,
  activeModuleId,
  todayDone,
  todayGoal,
  staffPreview,
}: {
  courseSlug: string;
  courseTitle: string;
  closeHref: string;
  outline: PlayerOutlineModule[];
  activeKey: string | null;
  activeModuleId: string | null;
  todayDone: number;
  todayGoal: number;
  staffPreview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(activeModuleId);

  useEffect(() => {
    setExpanded(activeModuleId);
  }, [activeModuleId]);

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <ModuleArt
            slug={courseSlug}
            size="thumb"
            className="shrink-0 rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
              {modulesCopy.outlineTitle}
            </p>
            <h2 className="mt-1 font-display text-lg leading-tight font-semibold text-ink">
              {courseTitle}
            </h2>
          </div>
        </div>
        <Link
          href={closeHref}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-navy/70 hover:bg-sand"
          aria-label={modulesCopy.backToModules}
        >
          <X className="size-4" />
        </Link>
      </div>

      <div className="mx-4 mt-4 rounded-2xl border border-border bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Flag className="size-4 text-navy" aria-hidden />
            {modulesCopy.todayGoalTitle}
          </p>
          <p className="text-sm font-semibold text-navy">
            {Math.min(todayDone, todayGoal)}/{todayGoal}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted">{modulesCopy.todayGoalBody}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-navy"
            style={{
              width: `${Math.min(100, (todayDone / todayGoal) * 100)}%`,
            }}
          />
        </div>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-4" aria-label={modulesCopy.outlineTitle}>
        {outline.map((lesson, index) => {
          const isOpen = expanded === lesson.id;
          return (
            <div key={lesson.id} className="mb-1">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-white"
                onClick={() =>
                  setExpanded((current) =>
                    current === lesson.id ? null : lesson.id,
                  )
                }
                aria-expanded={isOpen}
              >
                <span className={lesson.locked ? "text-navy/55" : undefined}>
                  Module {index + 1}: {lesson.title}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {lesson.locked ? (
                    <Lock className="size-3.5 text-navy/50" aria-label={modulesCopy.lockedBadge} />
                  ) : null}
                  {staffPreview && lesson.status === "DRAFT" ? (
                    <span className="text-[10px] font-semibold tracking-wide text-navy/50 uppercase">
                      {modulesCopy.draftBadge}
                    </span>
                  ) : null}
                </span>
              </button>
              {isOpen ? (
                <ul className="space-y-0.5 pb-2">
                  {lesson.items.map((item) => (
                    <OutlineRow
                      key={`${item.moduleId}-${item.key}`}
                      item={item}
                      active={
                        item.moduleId === activeModuleId && item.key === activeKey
                      }
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden h-full w-[20rem] shrink-0 border-r border-border/80 bg-[linear-gradient(180deg,#fbfcf7_0%,#f3f5eb_100%)] lg:block">
        {body}
      </aside>

      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <button
          type="button"
          className="inline-flex min-h-10 items-center rounded-xl border border-border bg-white px-3 text-sm font-semibold text-navy"
          onClick={() => setOpen(true)}
        >
          {modulesCopy.outlineTitle}
        </button>
        <Link href={closeHref} className="text-sm font-semibold text-navy">
          {modulesCopy.backToModules}
        </Link>
        {open ? (
          <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-navy/40"
              aria-label="Close outline"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[min(20rem,90vw)] bg-cream shadow-xl">
              {body}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function OutlineRow({
  item,
  active,
  onNavigate,
}: {
  item: PlayerOutlineItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const icon = item.complete ? (
    <Check className="size-3.5" aria-hidden />
  ) : item.locked ? (
    <Lock className="size-3.5" aria-hidden />
  ) : (
    <span className="size-2 rounded-full border border-navy/40" />
  );

  const content = (
    <>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          item.complete
            ? "bg-teal-bright/40 text-navy"
            : item.locked
              ? "bg-sand text-navy/50"
              : "bg-white text-navy/60",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate">{item.title}</span>
        <span className="block text-[11px] font-medium text-navy/45">
          {item.label === "Reading"
            ? modulesCopy.readingLabel
            : item.label === "Video"
              ? modulesCopy.videoLabel
              : modulesCopy.quizLabel}
        </span>
      </span>
    </>
  );

  if (item.locked) {
    return (
      <li>
        <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-sm text-navy/45">
          {content}
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-start gap-2 rounded-xl px-3 py-2 text-sm",
          active ? "bg-teal-bright/25 font-semibold text-navy" : "text-ink hover:bg-white",
        )}
      >
        {content}
      </Link>
    </li>
  );
}
