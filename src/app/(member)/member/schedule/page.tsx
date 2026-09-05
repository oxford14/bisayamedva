import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
  MemberStatusBadge,
} from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import {
  canShowMeetingUrl,
  formatSessionWhen,
  getMemberEnrollments,
  type MemberEnrollment,
} from "@/lib/member/data";
import { getOpenFutureSessions } from "@/lib/member/open-sessions";
import {
  courseCheckoutWithSession,
  type OpenFutureSession,
} from "@/lib/member/open-sessions-shared";
import { getStudentProfile } from "@/lib/supabase/auth";

const SEATED = new Set(["ACTIVE", "PENDING_PAYMENT", "COMPLETED"]);

function enrollmentForSession(
  enrollments: MemberEnrollment[],
  session: OpenFutureSession,
) {
  const bySession = enrollments.find(
    (e) => e.session?.id === session.id && SEATED.has(e.status),
  );
  if (bySession) return bySession;

  return (
    enrollments.find(
      (e) =>
        SEATED.has(e.status) &&
        (e.course?.id === session.course.id ||
          e.course?.slug === session.course.slug),
    ) ?? null
  );
}

function ScheduleSessionCard({
  session,
  enrollment,
}: {
  session: OpenFutureSession;
  enrollment: MemberEnrollment | null;
}) {
  const seated = enrollment && SEATED.has(enrollment.status);
  const showMeeting = enrollment ? canShowMeetingUrl(enrollment) : false;
  const slug = session.course.slug;

  return (
    <MemberCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            Weekend session
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            {session.title}
          </h2>
        </div>
        {seated && enrollment ? (
          <MemberStatusBadge status={enrollment.status} />
        ) : (
          <span className="inline-flex rounded-md bg-sand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy/70 uppercase">
            Open for enrollment
          </span>
        )}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            When
          </dt>
          <dd className="mt-1 text-sm font-medium text-ink">
            {formatSessionWhen({
              id: session.id,
              title: session.title,
              starts_at: session.starts_at,
              ends_at: session.ends_at,
              timezone: session.timezone,
              format: session.format,
              meeting_url: session.meeting_url,
              status: session.status,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Format
          </dt>
          <dd className="mt-1 text-sm font-medium text-ink">
            {session.format ?? "Online"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Course
          </dt>
          <dd className="mt-1 text-sm font-medium text-ink">
            {session.course.title}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
            Meeting link
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {showMeeting && enrollment?.session?.meeting_url ? (
              <a
                href={enrollment.session.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-teal hover:text-navy"
              >
                Open meeting
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : seated && enrollment?.status === "PENDING_PAYMENT" ? (
              <span className="text-muted">
                Available after payment is confirmed.
              </span>
            ) : seated && enrollment?.status === "ACTIVE" ? (
              <span className="text-muted">
                Meeting link coming soon from the team.
              </span>
            ) : (
              <span className="text-muted">
                Available after you enroll and your seat is active.
              </span>
            )}
          </dd>
        </div>
      </dl>

      {seated &&
      enrollment?.status === "PENDING_PAYMENT" &&
      enrollment.payment ? (
        <div className="mt-6 rounded-xl border border-border bg-cream/80 px-4 py-3">
          <p className="text-sm text-muted">
            Pending pa ang payment. Complete it para ma-unlock ang meeting
            details when your seat is active.
          </p>
          <Button variant="accent" size="sm" className="mt-3" asChild>
            <Link href={`/pay/${enrollment.payment.id}`}>Open payment</Link>
          </Button>
        </div>
      ) : null}

      {!seated && slug ? (
        <div className="mt-6">
          <Button variant="accent" asChild>
            <Link href={courseCheckoutWithSession(slug, session.id)}>
              Enroll
            </Link>
          </Button>
        </div>
      ) : null}
    </MemberCard>
  );
}

export default async function MemberSchedulePage() {
  const profile = await getStudentProfile();
  const [openSessions, enrollments] = await Promise.all([
    getOpenFutureSessions(),
    getMemberEnrollments(profile.id),
  ]);

  return (
    <div>
      <MemberPageHeader
        title="Schedule"
        description="Open weekend schedules from the team — enroll sa future dates lang."
      />

      {openSessions.length === 0 ? (
        <MemberEmptyState
          title="Wala pa’y open schedule"
          body="Check back later when admin opens the next weekend training date."
          action={
            <Button variant="accent" asChild>
              <Link href="/member/course">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {openSessions.map((session) => (
            <ScheduleSessionCard
              key={session.id}
              session={session}
              enrollment={enrollmentForSession(enrollments, session)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
