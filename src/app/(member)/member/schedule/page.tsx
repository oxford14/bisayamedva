import { MeetingOpenLink } from "@/components/member/meeting-open-link";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { scheduleCopy } from "@/content/site";
import { formatOpenSessionWhen } from "@/lib/member/open-sessions-shared";
import {
  getLiveSessionSchedule,
  liveSessionAsSession,
} from "@/lib/live-session/schedule";
import { liveSessionSummary } from "@/lib/live-session/schedule-shared";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberSchedulePage() {
  await getStudentProfile();
  const schedule = await getLiveSessionSchedule();
  const session = liveSessionAsSession(schedule);

  return (
    <div>
      <MemberPageHeader
        title={scheduleCopy.title}
        description={scheduleCopy.description}
      />

      {schedule.is_active ? (
        <div className="space-y-5">
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
              <span className="inline-flex rounded-md bg-teal-bright/25 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase">
                {scheduleCopy.currentSessionLabel}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  When
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {formatOpenSessionWhen(session)}
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
                  Repeats
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {liveSessionSummary(schedule)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Meeting link
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {schedule.meeting_url ? (
                    <MeetingOpenLink href={schedule.meeting_url} />
                  ) : (
                    <span className="text-muted">
                      {scheduleCopy.linkComingSoon}
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <p className="mt-6 text-sm text-muted">{scheduleCopy.seatedBody}</p>
          </MemberCard>
        </div>
      ) : (
        <MemberEmptyState
          title={scheduleCopy.emptyTitle}
          body={scheduleCopy.emptyBody}
        />
      )}
    </div>
  );
}
