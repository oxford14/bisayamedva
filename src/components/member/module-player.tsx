import type { ReactNode } from "react";
import Link from "next/link";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { ModuleArt } from "@/components/member/module-art";
import { ModulePlayerNext } from "@/components/member/module-player-next";
import { ModulePlayerOutline } from "@/components/member/module-player-outline";
import { ModulePlayerViewer } from "@/components/member/module-player-viewer";
import { ModuleQuiz } from "@/components/member/module-quiz";
import type { PlayerItemView } from "@/lib/member/module-player";

export function ModulePlayer({ view }: { view: PlayerItemView }) {
  if (!view.course) return null;
  const closeHref = `/member/modules/${view.course.slug}`;
  const isLast = !view.next;
  const continueHref = view.next?.href ?? closeHref;

  return (
    <div className="-mx-4 -mt-6 flex min-h-[calc(100dvh-8.5rem)] flex-col bg-cream sm:-mx-6 lg:-mx-8 lg:-mt-8 lg:min-h-[calc(100dvh-4.5rem)] lg:flex-row">
      <ModulePlayerOutline
        courseSlug={view.course.slug}
        courseTitle={view.course.title}
        closeHref={closeHref}
        outline={view.outline}
        activeKey={view.active?.key ?? null}
        activeModuleId={view.active?.moduleId ?? null}
        todayDone={view.todayDone}
        todayGoal={view.todayGoal}
        staffPreview={view.access.staffPreview}
      />

      <section className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-6">
        {!view.access.unlocked && !view.access.staffPreview ? (
          <LockedPane
            slug={view.course.slug}
            title={modulesCopy.lockedTitle}
            body={modulesCopy.lockedBody}
            detail={
              view.access.unlockLabel
                ? `${modulesCopy.unlocksAt} ${view.access.unlockLabel}`
                : null
            }
          />
        ) : !view.active || view.active.locked ? (
          <LockedPane
            slug={view.course.slug}
            title={modulesCopy.lockedTitle}
            body={modulesCopy.itemLockedBody}
            action={
              <Button asChild variant="secondary">
                <Link href={closeHref}>{modulesCopy.backToModules}</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="mb-4">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
                {view.active.label === "Reading"
                  ? modulesCopy.readingLabel
                  : view.active.label === "Video"
                    ? modulesCopy.videoLabel
                    : modulesCopy.quizLabel}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                {view.active.title}
              </h1>
              {view.access.staffPreview ? (
                <p className="mt-1 text-sm text-muted">{modulesCopy.staffPreview}</p>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {view.active.kind === "FILE" && view.file ? (
                <ModulePlayerViewer file={view.file} />
              ) : view.active.kind === "QUIZ" ? (
                <ModuleQuiz
                  moduleId={view.active.moduleId}
                  questions={view.quiz}
                  latestAttempt={view.latestAttempt}
                  nextHref={isLast ? null : continueHref}
                  isLast={isLast}
                  courseSlug={view.course.slug}
                />
              ) : (
                <p className="text-sm text-muted">{modulesCopy.noFiles}</p>
              )}
            </div>

            {view.active.kind === "FILE" && view.file ? (
              <div className="mt-4 flex justify-end">
                <ModulePlayerNext
                  moduleId={view.active.moduleId}
                  fileId={view.file.id}
                  fallbackHref={continueHref}
                  isLast={isLast}
                  courseSlug={view.course.slug}
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function LockedPane({
  slug,
  title,
  body,
  detail,
  action,
}: {
  slug: string;
  title: string;
  body: string;
  detail?: string | null;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center rounded-2xl border border-border bg-white p-6">
      <ModuleArt slug={slug} size="locked" className="rounded-2xl" />
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
      {detail ? <p className="mt-2 text-sm text-navy">{detail}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
