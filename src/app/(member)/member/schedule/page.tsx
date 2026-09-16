import Link from "next/link";
import { MeetingOpenLink } from "@/components/member/meeting-open-link";
import { ScheduleAssignButton } from "@/components/member/schedule-assign-button";
import { ScheduleReenrollButton } from "@/components/member/schedule-reenroll-button";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { scheduleCopy } from "@/content/site";
import {
  canShowMeetingUrl,
  formatSessionWhen,
  getMemberEnrollments,
  isMemberPaidEnrollment,
  requiresPaidReenrollment,
  type MemberEnrollment,
} from "@/lib/member/data";
import { getOpenFutureSessions } from "@/lib/member/open-sessions";
import type { OpenFutureSession } from "@/lib/member/open-sessions-shared";
import { getStudentProfile } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";

function matchesCourse(
  enrollment: MemberEnrollment,
  session: OpenFutureSession,
) {
  return (
    enrollment.course?.id === session.course.id ||
    Boolean(
      enrollment.course?.slug && enrollment.course.slug === session.course.slug,
    )
  );
}

type ScheduleCard = {
  key: string;
  session: OpenFutureSession;
  enrollment: MemberEnrollment;
  mode: "seated" | "choose" | "reenroll";
};

function buildScheduleCards(
  enrollments: MemberEnrollment[],
  openSessions: OpenFutureSession[],
): ScheduleCard[] {
  const cards: ScheduleCard[] = [];
  const assignedSessionId = (enrollment: MemberEnrollment) =>
    enrollment.session?.id ?? null;

  for (const enrollment of enrollments) {
    if (!isMemberPaidEnrollment(enrollment)) continue;

    const paidAgain = requiresPaidReenrollment(enrollment);
    const matchingOpen = openSessions.filter((session) =>
      matchesCourse(enrollment, session),
    );

    for (const session of matchingOpen) {
      const isCurrent = assignedSessionId(enrollment) === session.id;
      let mode: ScheduleCard["mode"];
      if (paidAgain) {
        mode = "reenroll";
      } else if (isCurrent) {
        mode = "seated";
      } else {
        mode = "choose";
      }
      cards.push({
        key: `${enrollment.id}-${session.id}`,
        session,
        enrollment,
        mode,
      });
    }
  }

  return cards.sort(
    (a, b) =>
      new Date(a.session.starts_at).getTime() -
      new Date(b.session.starts_at).getTime(),
  );
}

function ScheduleSessionCard({
  session,
  enrollment,
  mode,
}: {
  session: OpenFutureSession;
  enrollment: MemberEnrollment;
  mode: "seated" | "choose" | "reenroll";
}) {
  const seated = mode === "seated";
  const reenroll = mode === "reenroll";
  const showMeeting = seated ? canShowMeetingUrl(enrollment) : false;
  const meetingUrl =
    session.meeting_url ?? enrollment.session?.meeting_url ?? null;
  const switching =
    Boolean(enrollment.session?.id) &&
    enrollment.session?.id !== session.id;
  const courseSlug = session.course.slug ?? enrollment.course?.slug ?? "";
  const listPrice = Number(
    session.course.price ?? enrollment.course?.price ?? 0,
  );

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
        {seated ? (
          <span className="inline-flex rounded-md bg-teal-bright/25 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase">
            {scheduleCopy.currentSessionLabel}
          </span>
        ) : reenroll ? (
          <span className="inline-flex rounded-md bg-sand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy/70 uppercase">
            {scheduleCopy.reenrollBadge}
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-sand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy/70 uppercase">
            {scheduleCopy.pickTitle}
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
            {showMeeting && meetingUrl ? (
              <MeetingOpenLink href={meetingUrl} />
            ) : seated && enrollment.status === "PENDING_PAYMENT" ? (
              <span className="text-muted">
                Available after payment is confirmed.
              </span>
            ) : seated && enrollment.status === "ACTIVE" ? (
              <span className="text-muted">
                Meeting link coming soon from the team.
              </span>
            ) : reenroll ? (
              <span className="text-muted">{scheduleCopy.reenrollBody}</span>
            ) : (
              <span className="text-muted">{scheduleCopy.pickBody}</span>
            )}
          </dd>
        </div>
      </dl>

      {seated &&
      enrollment.status === "PENDING_PAYMENT" &&
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

      {seated ? (
        <p className="mt-6 text-sm text-muted">{scheduleCopy.seatedBody}</p>
      ) : reenroll ? (
        <>
          <p className="mt-6 text-sm text-muted">{scheduleCopy.reenrollBody}</p>
          <ScheduleReenrollButton
            courseSlug={courseSlug}
            sessionId={session.id}
            label={scheduleCopy.reenrollButton.replace(
              "{price}",
              formatPeso(listPrice),
            )}
          />
        </>
      ) : (
        <ScheduleAssignButton
          enrollmentId={enrollment.id}
          sessionId={session.id}
          switching={switching}
        />
      )}
    </MemberCard>
  );
}

export default async function MemberSchedulePage() {
  const profile = await getStudentProfile();
  const [openSessions, enrollments] = await Promise.all([
    getOpenFutureSessions(),
    getMemberEnrollments(profile.id),
  ]);

  const cards = buildScheduleCards(enrollments, openSessions);
  const hasPaidCourse = enrollments.some(isMemberPaidEnrollment);

  return (
    <div>
      <MemberPageHeader
        title={scheduleCopy.title}
        description={scheduleCopy.description}
      />

      {cards.length > 0 ? (
        <div className="space-y-5">
          {cards.map((card) => (
            <ScheduleSessionCard
              key={card.key}
              session={card.session}
              enrollment={card.enrollment}
              mode={card.mode}
            />
          ))}
        </div>
      ) : !hasPaidCourse ? (
        <MemberEmptyState
          title={scheduleCopy.emptyPaidTitle}
          body={scheduleCopy.emptyPaidBody}
          action={
            <Button variant="accent" asChild>
              <Link href="/member/course">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <MemberEmptyState
          title={scheduleCopy.emptyTitle}
          body={scheduleCopy.emptyBody}
          action={
            <Button variant="accent" asChild>
              <Link href="/member/course">Browse courses</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
