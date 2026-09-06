import Link from "next/link";
import { ArrowRight, BookOpen, Lock, Unlock } from "lucide-react";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  ModuleAccessBadge,
  ModuleArt,
} from "@/components/member/module-art";
import {
  MemberCard,
  MemberEmptyState,
} from "@/components/member/ui";
import { cn } from "@/lib/utils";
import type { ModuleCourseCard } from "@/lib/member/modules";

export function ModulesCatalog({
  courses,
  activeSlug,
  staffPreview = false,
}: {
  courses: ModuleCourseCard[];
  activeSlug?: string;
  staffPreview?: boolean;
}) {
  if (courses.length === 0) {
    return (
      <MemberEmptyState
        title={staffPreview ? "No courses yet" : modulesCopy.emptyTitle}
        body={
          staffPreview
            ? "Create a course in Admin, then add Modules to preview here."
            : modulesCopy.emptyBody
        }
        action={
          <Button asChild variant="accent">
            <Link href={staffPreview ? "/admin/modules" : "/member/course"}>
              {staffPreview ? "Open Admin Modules" : modulesCopy.emptyCta}
            </Link>
          </Button>
        }
      />
    );
  }

  const visible = activeSlug
    ? courses.filter((course) => course.slug === activeSlug)
    : courses;
  const openCount = courses.filter((course) => course.unlocked).length;
  const lockedCount = courses.length - openCount;
  const nextLocked = courses.find(
    (course) => !course.unlocked && course.unlockLabel,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">
          {modulesCopy.catalogSection}
        </h2>
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
        <div className="grid gap-5 md:grid-cols-2">
          {visible.map((course) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<BookOpen className="size-4" aria-hidden />}
          label={modulesCopy.statEnrolled}
          value={courses.length}
        />
        <StatCard
          icon={<Unlock className="size-4" aria-hidden />}
          label={modulesCopy.statOpen}
          value={openCount}
        />
        <StatCard
          icon={<Lock className="size-4" aria-hidden />}
          label={modulesCopy.statLocked}
          value={lockedCount}
          hint={
            nextLocked?.unlockLabel
              ? `${modulesCopy.statNextUnlock} ${nextLocked.unlockLabel}`
              : null
          }
        />
      </div>

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string | null;
}) {
  return (
    <MemberCard>
      <div className="flex items-center gap-2 text-navy/60">
        {icon}
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
          {label}
        </p>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </MemberCard>
  );
}

function CourseCard({ course }: { course: ModuleCourseCard }) {
  return (
    <Link
      href={`/member/modules/${course.slug}`}
      className="group block h-full"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(47,56,38,0.04)] transition-shadow hover:shadow-[0_12px_28px_rgba(47,56,38,0.08)]">
        <div className="p-4 pb-0">
          <ModuleArt slug={course.slug} size="card" className="rounded-xl" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              {course.title}
            </h2>
            <ModuleAccessBadge unlocked={course.unlocked} />
          </div>
          {course.subtitle ? (
            <p className="mt-1 text-sm text-muted">{course.subtitle}</p>
          ) : null}
          {course.unlockLabel ? (
            <p className="mt-3 text-sm text-muted">
              {course.unlocked
                ? modulesCopy.unlockedSince
                : modulesCopy.unlocksAt}{" "}
              {course.unlockLabel}
            </p>
          ) : null}
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-teal group-hover:text-navy">
            {modulesCopy.openCta}
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </article>
    </Link>
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