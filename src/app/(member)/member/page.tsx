import Link from "next/link";
import { ArrowRight, CalendarDays, CreditCard, BookOpen } from "lucide-react";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
  MemberStatusBadge,
} from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import {
  enrollmentNextAction,
  formatSessionWhen,
  getMemberEnrollments,
  pickPrimaryEnrollment,
} from "@/lib/member/data";
import { requireStudent } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";

export default async function MemberHomePage() {
  const profile = await requireStudent();
  const enrollments = await getMemberEnrollments(profile.id);
  const primary = pickPrimaryEnrollment(enrollments);
  const next = enrollmentNextAction(primary);
  const firstName =
    profile.full_name.split(/\s+/).filter(Boolean)[0] ?? "ka";

  return (
    <div>
      <MemberPageHeader
        title={`Maayong adlaw, ${firstName}`}
        description="Here is your Medical Billing training overview — klaro kung unsa ang next step."
      />

      <MemberCard className="bg-[linear-gradient(135deg,#ffffff_0%,#f3f5eb_100%)]">
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
            title="No training yet"
            body="Once you are enrolled, you will see your course, weekend schedule, and payment status here."
            action={
              <Button variant="secondary" asChild>
                <Link href="/register">Register for training</Link>
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
              {primary.session?.title ?? "Weekend session"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatSessionWhen(primary.session)}
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
