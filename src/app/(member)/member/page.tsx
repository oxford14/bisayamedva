import Link from "next/link";
import { ArrowRight, CalendarDays, CreditCard, BookOpen } from "lucide-react";
import { MemberHomeUpdates } from "@/components/member/member-home-updates";
import { listPublishedAnnouncementsForUser } from "@/lib/member/announcements";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
  MemberStatusBadge,
} from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import {
  enrollmentNextAction,
  getMemberEnrollments,
  pickPrimaryEnrollment,
} from "@/lib/member/data";
import { formatOpenSessionWhen } from "@/lib/member/open-sessions-shared";
import {
  getLiveSessionSchedule,
  liveSessionAsSession,
} from "@/lib/live-session/schedule";
import { getStudentProfile } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";

export default async function MemberHomePage() {
  const profile = await getStudentProfile();
  const [enrollments, homeAnnouncements, schedule] = await Promise.all([
    getMemberEnrollments(profile.id),
    listPublishedAnnouncementsForUser(profile.id, 2),
    getLiveSessionSchedule(),
  ]);
  const liveSession = liveSessionAsSession(schedule);
  const primary = pickPrimaryEnrollment(
    enrollments.filter((enrollment) => enrollment.status !== "CANCELLED"),
  );
  const next = enrollmentNextAction(primary);
  const firstName =
    profile.full_name.split(/\s+/).filter(Boolean)[0] ?? "ka";

  return (
    <div>
      <MemberPageHeader
        title={`Maayong adlaw, ${firstName}`}
        description="Here is your Medical Billing training overview — klaro kung unsa ang next step."
      />

      <MemberHomeUpdates announcements={homeAnnouncements} />

      <MemberCard className="mt-6 bg-[linear-gradient(135deg,#ffffff_0%,#f3f5eb_100%)]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/50 uppercase">
          Next step
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
          {next.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{next.body}</p>
        <Button variant="accent" className="mt-5" asChild>
          <Link href={next.href}>
            {next.cta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </MemberCard>

      {!primary ? (
        <div className="mt-6">
          <MemberEmptyState
            title="Get the full course + certificate"
            body="Free ang weekend live session. Enroll in a course para ma-unlock ang modules, Practice Lab, Student Lounge, ug imong certificate."
            action={
              <Button variant="secondary" asChild>
                <Link href="/member/course">Browse courses</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MemberCard>
            <div className="flex items-center gap-2 text-navy/60">
              <BookOpen className="size-4" aria-hidden />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
                Course
              </p>
            </div>
            <p className="mt-3 font-semibold text-ink">
              {primary.course?.title ?? "Course"}
            </p>
            <div className="mt-2">
              <MemberStatusBadge status={primary.status} />
            </div>
            <Link
              href="/member/course"
              className="mt-4 inline-flex text-sm font-medium text-teal hover:text-navy"
            >
              View course
            </Link>
          </MemberCard>

          <MemberCard>
            <div className="flex items-center gap-2 text-navy/60">
              <CalendarDays className="size-4" aria-hidden />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
                Schedule
              </p>
            </div>
            <p className="mt-3 font-semibold text-ink">
              {liveSession.title}
            </p>
            <p className="mt-1 text-sm text-muted">
              {schedule.is_active
                ? formatOpenSessionWhen(liveSession)
                : "Schedule coming soon"}
            </p>
            <Link
              href="/member/schedule"
              className="mt-4 inline-flex text-sm font-medium text-teal hover:text-navy"
            >
              View schedule
            </Link>
          </MemberCard>

          <MemberCard>
            <div className="flex items-center gap-2 text-navy/60">
              <CreditCard className="size-4" aria-hidden />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
                Payment
              </p>
            </div>
            <p className="mt-3 font-semibold text-ink">
              {primary.payment
                ? formatPeso(Number(primary.payment.amount))
                : "No payment yet"}
            </p>
            <div className="mt-2">
              {primary.payment ? (
                <MemberStatusBadge status={primary.payment.status} />
              ) : (
                <span className="text-sm text-muted">Pending setup</span>
              )}
            </div>
            <Link
              href="/member/payments"
              className="mt-4 inline-flex text-sm font-medium text-teal hover:text-navy"
            >
              View payments
            </Link>
          </MemberCard>
        </div>
      )}
    </div>
  );
}
