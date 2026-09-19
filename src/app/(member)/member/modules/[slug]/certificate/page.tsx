import Link from "next/link";
import { CertificateViewer } from "@/components/member/certificate-viewer";
import { ModuleArt } from "@/components/member/module-art";
import { ModulePlayerOutline } from "@/components/member/module-player-outline";
import { MemberEmptyState, MemberPageHeader } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { certificatesCopy, modulesCopy } from "@/content/site";
import { ensureMemberCertificate } from "@/lib/member/certificates";
import { canGenerateCertificates } from "@/lib/member/certificate-shared";
import { getCoursePlayerState } from "@/lib/member/module-player";
import { getCertificateVerifyUrl } from "@/lib/payments/pay-url";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function MemberModuleCertificatePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getStudentProfile();
  const certificate = await ensureMemberCertificate(
    profile.id,
    slug,
    profile.role,
    profile.email,
  );
  const state = await getCoursePlayerState(
    profile.id,
    slug,
    profile.role,
    profile.email,
  );

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

  const closeHref = `/member/modules/${state.course.slug}`;
  const verifyUrl = certificate
    ? getCertificateVerifyUrl(certificate.certificateId)
    : null;
  const generationEnabled = canGenerateCertificates(profile.email);

  return (
    <div className="-mx-4 -mt-6 flex min-h-[calc(100dvh-8.5rem)] flex-col bg-cream sm:-mx-6 lg:-mx-8 lg:-mt-8 lg:min-h-[calc(100dvh-4.5rem)] lg:flex-row">
      <div className="print:hidden">
      <ModulePlayerOutline
        courseSlug={state.course.slug}
        courseTitle={state.course.title}
        closeHref={closeHref}
        outline={state.outline}
        activeKey={null}
        activeModuleId={null}
        todayDone={state.todayDone}
        todayGoal={state.todayGoal}
        staffPreview={state.access.staffPreview}
      />
      </div>

      <section className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-6">
        {certificate && generationEnabled ? (
          <>
            <div className="mb-4 print:hidden">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/45 uppercase">
                {certificatesCopy.nav}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                {modulesCopy.viewCertificate}
              </h1>
            </div>
            <CertificateViewer
              certificate={certificate}
              studentName={profile.full_name}
              generationEnabled={generationEnabled}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-start justify-center rounded-2xl border border-border bg-white p-6">
            <ModuleArt
              slug={state.course.slug}
              size="locked"
              className="rounded-2xl"
            />
            <h1 className="mt-4 font-display text-xl font-semibold text-ink">
              {certificate && !generationEnabled
                ? certificatesCopy.unavailableTitle
                : modulesCopy.certificateNotReadyTitle}
            </h1>
            <p className="mt-1 max-w-md text-sm text-muted">
              {certificate && !generationEnabled
                ? certificatesCopy.unavailableBody
                : modulesCopy.certificateNotReadyBody}
            </p>
            {certificate && !generationEnabled && verifyUrl ? (
              <div className="mt-5 w-full max-w-md rounded-xl border border-border bg-cream/50 px-4 py-3 text-left">
                <p className="text-sm text-muted">{certificatesCopy.verifyTestLead}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                  {certificatesCopy.idLabel}
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-ink">
                  {certificate.certificateId}
                </p>
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-navy underline"
                >
                  {certificatesCopy.verifyTestOpen}
                </a>
                <p className="mt-2 break-all font-mono text-xs text-muted">{verifyUrl}</p>
              </div>
            ) : null}
            <Button asChild variant="secondary" className="mt-5">
              <Link href={closeHref}>{modulesCopy.backToModules}</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
