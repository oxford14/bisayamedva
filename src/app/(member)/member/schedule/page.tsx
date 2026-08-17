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
  pickPrimaryEnrollment,
} from "@/lib/member/data";
import { requireStudent } from "@/lib/supabase/auth";

export default async function MemberSchedulePage() {
  const profile = await requireStudent();
  const enrollments = await getMemberEnrollments(profile.id);
  const primary = pickPrimaryEnrollment(enrollments);
  const showMeeting = primary ? canShowMeetingUrl(primary) : false;

  return (
    <div>
      <MemberPageHeader
        title="Schedule"
        description="Imong weekend training time — check this before class starts."
      />

      {!primary?.session ? (
        <MemberEmptyState
          title="No schedule yet"
          body={
            primary
              ? "Naay enrollment, pero wala pa assigned session. Wait for admin assignment or check back later."
              : "Register and enroll first para makita ang weekend schedule."
          }
          action={
            <Button variant="accent" asChild>
              <Link href={primary ? "/member" : "/register"}>
                {primary ? "Back to home" : "Register"}
              </Link>
            </Button>
          }
        />
      ) : (
        <MemberCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                Weekend session
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                {primary.session.title}
              </h2>
            </div>
            <MemberStatusBadge status={primary.status} />
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                When
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {formatSessionWhen(primary.session)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                Format
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {primary.session.format ?? "Online"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                Course
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                {primary.course?.title ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                Meeting link
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {showMeeting ? (
                  <a
                    href={primary.session.meeting_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-teal hover:text-navy"
                  >
                    Open meeting
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : primary.status === "PENDING_PAYMENT" ? (
                  <span className="text-muted">
                    Available after payment is confirmed.
                  </span>
                ) : primary.status === "ACTIVE" ? (
                  <span className="text-muted">
                    Meeting link coming soon from the team.
                  </span>
                ) : (
                  <span className="text-muted">Not available for this status.</span>
                )}
              </dd>
            </div>
          </dl>

          {primary.status === "PENDING_PAYMENT" && primary.payment ? (
            <div className="mt-6 rounded-xl border border-border bg-cream/80 px-4 py-3">
              <p className="text-sm text-muted">
                Pending pa ang payment. Complete it para ma-unlock ang meeting
                details when your seat is active.
              </p>
              <Button variant="accent" size="sm" className="mt-3" asChild>
                <Link href={`/pay/${primary.payment.id}`}>Open payment</Link>
              </Button>
            </div>
          ) : null}
        </MemberCard>
      )}
    </div>
  );
}
