import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HipaaCertificateStep } from "@/components/member/hipaa-certificate-step";
import { ModulePlayerOutline } from "@/components/member/module-player-outline";
import { MemberEmptyState, MemberPageHeader } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { hipaaCopy, modulesCopy } from "@/content/site";
import {
  courseRequiresHipaaGate,
  HIPAA_GATE_MODULE_ID,
  hipaaItemKey,
} from "@/lib/member/hipaa-gate";
import { getCoursePlayerState } from "@/lib/member/module-player";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MemberHipaaCertificatePage({ params }: Props) {
  const { slug } = await params;
  if (!courseRequiresHipaaGate(slug)) notFound();

  const profile = await getStudentProfile();
  const state = await getCoursePlayerState(profile.id, slug, profile.role);

  if (!state.course) {
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

  const hipaaItem = state.flat.find((item) => item.kind === "HIPAA");
  if (!hipaaItem) {
    return (
      <div>
        <MemberPageHeader title={hipaaCopy.stepTitle} />
        <MemberEmptyState
          title="Not available yet"
          body="Finish Module 8 una — then this HIPAA step mo-unlock."
          action={
            <Button asChild variant="secondary">
              <Link href={`/member/modules/${slug}`}>{modulesCopy.backToModules}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (hipaaItem.locked && !state.access.staffPreview) {
    redirect(`/member/modules/${slug}`);
  }

  const hipaaIndex = state.flat.findIndex((item) => item.kind === "HIPAA");
  const nextHref =
    hipaaIndex >= 0 ? (state.flat[hipaaIndex + 1]?.href ?? null) : null;
  const closeHref = `/member/modules/${slug}`;

  return (
    <div className="-mx-4 -mt-6 flex min-h-[calc(100dvh-8.5rem)] flex-col bg-cream sm:-mx-6 lg:-mx-8 lg:-mt-8 lg:min-h-[calc(100dvh-4.5rem)] lg:flex-row">
      <ModulePlayerOutline
        courseSlug={state.course.slug}
        courseTitle={state.course.title}
        closeHref={closeHref}
        outline={state.outline}
        activeKey={hipaaItemKey()}
        activeModuleId={HIPAA_GATE_MODULE_ID}
        todayDone={state.todayDone}
        todayGoal={state.todayGoal}
        staffPreview={state.access.staffPreview}
      />

      <section className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
            {hipaaCopy.outlineModuleTitle}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {hipaaCopy.stepTitle}
          </h1>
        </div>
        <HipaaCertificateStep
          courseSlug={slug}
          gate={state.hipaa}
          nextHref={nextHref}
        />
      </section>
    </div>
  );
}
