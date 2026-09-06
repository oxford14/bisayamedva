import Link from "next/link";
import { formatModuleCount } from "@/content/module-art";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  ModuleAccessBadge,
  ModuleArt,
} from "@/components/member/module-art";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { getCoursePlayerState } from "@/lib/member/module-player";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MemberCourseModulesPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getStudentProfile();
  const { course, access, outline: modules } = await getCoursePlayerState(
    profile.id,
    slug,
    profile.role,
  );

  if (!course || !access.enrolled) {
    return (
      <div>
        <MemberPageHeader
          title={modulesCopy.title}
          description={modulesCopy.description}
        />
        <MemberEmptyState
          title={modulesCopy.notEnrolledTitle}
          body={modulesCopy.notEnrolledBody}
          action={
            <Button asChild variant="secondary">
              <Link href="/member/modules">{modulesCopy.filterAll}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const description = access.staffPreview
    ? modulesCopy.staffPreview
    : access.unlocked
      ? modulesCopy.openLessons
      : access.unlockLabel
        ? `${modulesCopy.lockedBody} ${modulesCopy.unlocksAt} ${access.unlockLabel}.`
        : modulesCopy.lockedBody;

  return (
    <div>
      <MemberPageHeader
        title={course.title}
        description={description}
        actions={
          <Button asChild variant="ghost">
            <Link href="/member/modules">{modulesCopy.allModules}</Link>
          </Button>
        }
      />

      <article className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(47,56,38,0.04)] md:grid md:grid-cols-[minmax(0,18rem)_1fr]">
        <ModuleArt
          slug={course.slug}
          size="hero"
          priority
          className="md:min-h-full"
        />
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
            {formatModuleCount(modules.length, modulesCopy)}
          </p>
          {course.subtitle ? (
            <p className="mt-2 text-sm text-muted">{course.subtitle}</p>
          ) : null}
          <div className="mt-4">
            <ModuleAccessBadge unlocked={access.unlocked} />
          </div>
          {access.unlockLabel ? (
            <p className="mt-3 text-sm text-muted">
              {access.unlocked
                ? modulesCopy.unlockedSince
                : modulesCopy.unlocksAt}{" "}
              {access.unlockLabel}
            </p>
          ) : null}
        </div>
      </article>

      {modules.length === 0 ? (
        <MemberEmptyState
          title={modulesCopy.noModulesTitle}
          body={modulesCopy.noModulesBody}
        />
      ) : (
        <div className="space-y-3">
          {modules.map((item, index) => {
            const moduleOpen = access.unlocked && !item.locked;
            const card = (
              <MemberCard
                className={
                  moduleOpen
                    ? "transition-shadow hover:shadow-[0_12px_28px_rgba(47,56,38,0.08)]"
                    : "opacity-90"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand font-display text-sm font-semibold text-navy">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
                        Module {index + 1}
                      </p>
                      <h2 className="mt-1 font-display text-lg font-semibold text-ink">
                        {item.title}
                      </h2>
                      {item.description ? (
                        <p className="mt-1 text-sm text-muted">
                          {item.description}
                        </p>
                      ) : null}
                      {item.locked && access.unlocked ? (
                        <p className="mt-2 text-sm text-muted">
                          {modulesCopy.moduleQuizLocked}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {access.staffPreview && item.status === "DRAFT" ? (
                      <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase text-navy/80">
                        {modulesCopy.draftBadge}
                      </span>
                    ) : null}
                    <ModuleAccessBadge unlocked={moduleOpen} />
                  </div>
                </div>
              </MemberCard>
            );

            if (!moduleOpen) {
              return <div key={item.id}>{card}</div>;
            }

            return (
              <Link
                key={item.id}
                href={`/member/modules/${course.slug}/${item.id}`}
                className="block"
              >
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}