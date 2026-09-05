import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  MemberCard,
  MemberEmptyState,
} from "@/components/member/ui";
import { cn } from "@/lib/utils";
import type { ModuleCourseCard } from "@/lib/member/modules";

export function ModulesCatalog({
  courses,
  activeSlug,
}: {
  courses: ModuleCourseCard[];
  activeSlug?: string;
}) {
  if (courses.length === 0) {
    return (
      <MemberEmptyState
        title={modulesCopy.emptyTitle}
        body={modulesCopy.emptyBody}
        action={
          <Button asChild variant="accent">
            <Link href="/member/course">{modulesCopy.emptyCta}</Link>
          </Button>
        }
      />
    );
  }

  const visible = activeSlug
    ? courses.filter((course) => course.slug === activeSlug)
    : courses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <FilterChip href="/member/modules" active={!activeSlug}>
          {modulesCopy.filterAll}
        </FilterChip>
        {courses.map((course) => (
          <FilterChip
            key={course.courseId}
            href={`/member/modules?course=${course.slug}`}
            active={activeSlug === course.slug}
          >
            {course.title}
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <MemberEmptyState
          title={modulesCopy.notEnrolledTitle}
          body={modulesCopy.notEnrolledBody}
          action={
            <Button asChild variant="secondary">
              <Link href="/member/modules">{modulesCopy.filterAll}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((course) => (
            <Link key={course.courseId} href={`/member/modules/${course.slug}`}>
              <MemberCard className="h-full transition-shadow hover:shadow-[0_12px_28px_rgba(47,56,38,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {course.title}
                    </h2>
                    {course.subtitle ? (
                      <p className="mt-1 text-sm text-muted">{course.subtitle}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
                      course.unlocked
                        ? "bg-teal-bright/25 text-navy"
                        : "bg-sand text-navy/80",
                    )}
                  >
                    {course.unlocked ? (
                      <Unlock className="size-3" aria-hidden />
                    ) : (
                      <Lock className="size-3" aria-hidden />
                    )}
                    {course.unlocked
                      ? modulesCopy.openBadge
                      : modulesCopy.lockedBadge}
                  </span>
                </div>
                {course.unlockLabel ? (
                  <p className="mt-4 text-sm text-muted">
                    {course.unlocked ? "Unlocked since" : modulesCopy.unlocksAt}{" "}
                    {course.unlockLabel}
                  </p>
                ) : null}
              </MemberCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors",
        active
          ? "border-navy bg-navy text-cream"
          : "border-border bg-white text-navy/70 hover:bg-sand",
      )}
    >
      {children}
    </Link>
  );
}
