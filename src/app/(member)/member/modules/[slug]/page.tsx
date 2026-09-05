import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { getStudentCourseModules } from "@/lib/member/modules";
import { getStudentProfile } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MemberCourseModulesPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getStudentProfile();
  const { course, access, modules } = await getStudentCourseModules(
    profile.id,
    slug,
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

  return (
    <div>
      <MemberPageHeader
        title={course.title}
        description={
          access.unlocked
            ? "Open a module to view files and take the quiz."
            : access.unlockLabel
              ? `${modulesCopy.lockedBody} ${modulesCopy.unlocksAt} ${access.unlockLabel}.`
              : modulesCopy.lockedBody
        }
        actions={
          <Button asChild variant="ghost">
            <Link href="/member/modules">All modules</Link>
          </Button>
        }
      />

      {modules.length === 0 ? (
        <MemberEmptyState
          title={modulesCopy.noModulesTitle}
          body={modulesCopy.noModulesBody}
        />
      ) : (
        <div className="space-y-3">
          {modules.map((item, index) => (
            <Link key={item.id} href={`/member/modules/${course.slug}/${item.id}`}>
              <MemberCard className="transition-shadow hover:shadow-[0_12px_28px_rgba(47,56,38,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
                      Module {index + 1}
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-ink">
                      {item.title}
                    </h2>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted">{item.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
                      access.unlocked
                        ? "bg-teal-bright/25 text-navy"
                        : "bg-sand text-navy/80",
                    )}
                  >
                    {access.unlocked ? (
                      <Unlock className="size-3" aria-hidden />
                    ) : (
                      <Lock className="size-3" aria-hidden />
                    )}
                    {access.unlocked
                      ? modulesCopy.openBadge
                      : modulesCopy.lockedBadge}
                  </span>
                </div>
              </MemberCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
