import Link from "next/link";
import { Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { ModuleFiles } from "@/components/member/module-files";
import { ModuleQuiz } from "@/components/member/module-quiz";
import {
  canOpenCourseModules,
  getStudentModulePlayer,
} from "@/lib/member/modules";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string; moduleId: string }>;
};

export default async function MemberModulePlayerPage({ params }: Props) {
  const { slug, moduleId } = await params;
  const profile = await getStudentProfile();
  const player = await getStudentModulePlayer(profile.id, slug, moduleId);

  if (!player.course) {
    return (
      <div>
        <MemberPageHeader title={modulesCopy.title} />
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

  if (!player.module) notFound();

  const open = canOpenCourseModules(player.access);

  return (
    <div className="space-y-6">
      <MemberPageHeader
        title={player.module.title}
        description={player.module.description ?? player.course.title}
        actions={
          <Button asChild variant="ghost">
            <Link href={`/member/modules/${player.course.slug}`}>
              Back to {player.course.title}
            </Link>
          </Button>
        }
      />

      {!open ? (
        <MemberCard className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sand text-navy">
            <Lock className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-ink">{modulesCopy.lockedTitle}</h2>
            <p className="mt-1 text-sm text-muted">{modulesCopy.lockedBody}</p>
            {player.access.unlockLabel ? (
              <p className="mt-2 text-sm text-navy">
                {modulesCopy.unlocksAt} {player.access.unlockLabel}
              </p>
            ) : null}
          </div>
        </MemberCard>
      ) : (
        <>
          <MemberCard>
            <h2 className="font-display text-lg font-semibold text-ink">
              {modulesCopy.filesTitle}
            </h2>
            <div className="mt-4">
              <ModuleFiles files={player.files} />
            </div>
          </MemberCard>

          <MemberCard>
            <h2 className="font-display text-lg font-semibold text-ink">
              {modulesCopy.quizTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">{modulesCopy.quizCta}</p>
            <div className="mt-4">
              <ModuleQuiz
                moduleId={player.module.id}
                questions={player.quiz}
                latestAttempt={player.latestAttempt}
              />
            </div>
          </MemberCard>
        </>
      )}
    </div>
  );
}
