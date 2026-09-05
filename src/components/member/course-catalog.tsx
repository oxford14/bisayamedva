"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Video } from "lucide-react";
import {
  foundationCourses,
  upskillCourses,
  type CatalogCourse,
} from "@/content/courses";
import { site } from "@/content/site";
import { Button } from "@/components/ui/button";
import { EnrollScheduleModal } from "@/components/member/enroll-schedule-modal";
import { MemberStatusBadge } from "@/components/member/ui";
import { cn, formatPeso } from "@/lib/utils";
import type { MemberEnrollment } from "@/lib/member/data";
import type { OpenFutureSession } from "@/lib/member/open-sessions-shared";

function primaryOwned(enrollments: MemberEnrollment[]) {
  const priority = ["ACTIVE", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"];
  return (
    [...enrollments].sort((a, b) => {
      const ai = priority.indexOf(a.status);
      const bi = priority.indexOf(b.status);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0] ?? null
  );
}

function enrollmentForCourse(
  enrollments: MemberEnrollment[],
  catalogCourse: CatalogCourse,
) {
  return enrollments.find(
    (e) =>
      e.course?.slug === catalogCourse.slug ||
      e.course?.title === catalogCourse.title,
  );
}

function isOwnedEnrollment(enrollment: MemberEnrollment | undefined) {
  if (!enrollment) return false;
  return (
    enrollment.status === "ACTIVE" ||
    enrollment.status === "COMPLETED" ||
    enrollment.status === "PENDING_PAYMENT"
  );
}

function CourseThumb({
  label,
  accent,
}: {
  label: string;
  accent: "foundation" | "upskill";
}) {
  return (
    <div
      className={cn(
        "relative flex h-36 items-end overflow-hidden rounded-xl px-4 py-3",
        accent === "foundation"
          ? "bg-[linear-gradient(135deg,#5b6d49_0%,#3f4a32_55%,#a2ac82_120%)]"
          : "bg-[linear-gradient(135deg,#455338_0%,#2f3826_50%,#5b6d49_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(162,172,130,0.5), transparent 40%)",
        }}
      />
      <p className="relative z-[1] text-sm font-semibold text-cream">{label}</p>
    </div>
  );
}

function CourseCard({
  course,
  enrollment,
  sessions,
  onEnroll,
}: {
  course: CatalogCourse;
  enrollment?: MemberEnrollment;
  sessions: OpenFutureSession[];
  onEnroll: (course: CatalogCourse, sessions: OpenFutureSession[]) => void;
}) {
  const owned = isOwnedEnrollment(enrollment);
  const accent = course.courseType === "FOUNDATION" ? "foundation" : "upskill";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
      <div className="p-4 pb-0">
        <CourseThumb label={course.subtitle} accent={accent} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-navy/70 uppercase">
            {course.courseType === "FOUNDATION" ? "Foundation" : "Upskill"}
          </span>
          {course.courseType === "UPSKILL" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-navy uppercase">
              <Video className="size-3.5" aria-hidden />
              Live Zoom
            </span>
          ) : null}
          {owned && enrollment ? (
            <MemberStatusBadge status={enrollment.status} />
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-xl font-semibold text-ink">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{course.subtitle}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {course.description}
        </p>

        <div className="mt-auto border-t border-border pt-4">
          <p className="mb-3 font-display text-3xl font-semibold text-navy">
            {formatPeso(course.price)}
          </p>

          {owned ? (
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/member/schedule">View schedule</Link>
            </Button>
          ) : (
            <Button
              variant="accent"
              className="w-full"
              type="button"
              onClick={() => onEnroll(course, sessions)}
            >
              {`Enroll · ${formatPeso(course.price)}`}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function MemberCourseCatalog({
  enrollments,
  openSessions,
}: {
  enrollments: MemberEnrollment[];
  openSessions: OpenFutureSession[];
}) {
  const primary = primaryOwned(enrollments);
  const [modalCourse, setModalCourse] = useState<CatalogCourse | null>(null);
  const [modalSessions, setModalSessions] = useState<OpenFutureSession[]>([]);

  const sessionsBySlug = useMemo(() => {
    const map = new Map<string, OpenFutureSession[]>();
    for (const session of openSessions) {
      const slug = session.course.slug;
      if (!slug) continue;
      const list = map.get(slug) ?? [];
      list.push(session);
      map.set(slug, list);
    }
    return map;
  }, [openSessions]);

  function openEnroll(course: CatalogCourse, sessions: OpenFutureSession[]) {
    setModalCourse(course);
    setModalSessions(sessions);
  }

  function closeEnroll() {
    setModalCourse(null);
    setModalSessions([]);
  }

  return (
    <div className="space-y-10">
      {primary ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Imong active training
              </h2>
              <p className="mt-1 text-sm text-muted">
                Courses you already enrolled in show here first.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                  {primary.course?.course_type ?? "Owned"}
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {primary.course?.title ?? site.featuredCourse.name}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {primary.session?.title ?? "Session TBA"}
                </p>
              </div>
              <MemberStatusBadge status={primary.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="accent" asChild>
                <Link href="/member/schedule">Open schedule</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/member/wallet">Open wallet</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Foundation
          </h2>
          <p className="mt-1 text-sm text-muted">
            Duha ka Masterclasses —{" "}
            {formatPeso(foundationCourses[0]?.price ?? 499)} each. Enroll and
            pick an open weekend schedule inside your account.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {foundationCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollment={enrollmentForCourse(enrollments, course)}
              sessions={sessionsBySlug.get(course.slug) ?? []}
              onEnroll={openEnroll}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-ink">Upskill</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Specialized Medical VA topics —{" "}
            {formatPeso(upskillCourses[0]?.price ?? 1000)} each. Enroll
            individually after your Foundation training.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {upskillCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollment={enrollmentForCourse(enrollments, course)}
              sessions={sessionsBySlug.get(course.slug) ?? []}
              onEnroll={openEnroll}
            />
          ))}
        </div>
      </section>

      {modalCourse ? (
        <EnrollScheduleModal
          open
          courseTitle={modalCourse.title}
          courseSlug={modalCourse.slug}
          coursePrice={modalCourse.price}
          sessions={modalSessions}
          onClose={closeEnroll}
        />
      ) : null}
    </div>
  );
}
