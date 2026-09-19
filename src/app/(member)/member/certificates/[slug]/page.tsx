import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateViewer } from "@/components/member/certificate-viewer";
import { MemberEmptyState, MemberPageHeader } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { certificatesCopy } from "@/content/site";
import { getMemberCertificate } from "@/lib/member/certificates";
import { canGenerateCertificates } from "@/lib/member/certificate-shared";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberCertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getStudentProfile();
  const certificate = await getMemberCertificate(
    profile.id,
    slug,
    profile.email,
  );

  if (!certificate) {
    notFound();
  }

  const generationEnabled = canGenerateCertificates(profile.email);

  if (!generationEnabled) {
    return (
      <div>
        <MemberPageHeader
          title={certificatesCopy.title}
          description={certificatesCopy.description}
        />
        <MemberEmptyState
          title={certificatesCopy.unavailableTitle}
          body={certificatesCopy.unavailableBody}
          action={
            <Button variant="secondary" asChild>
              <Link href="/member/modules">{certificatesCopy.emptyCta}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <MemberPageHeader
          title={certificate.title}
          description={certificatesCopy.description}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link href="/member/certificates">{certificatesCopy.back}</Link>
              </Button>
            </div>
          }
        />
      </div>

      <div className="mt-6 flex min-h-[32rem]">
        <CertificateViewer
          certificate={certificate}
          studentName={profile.full_name}
          generationEnabled={generationEnabled}
        />
      </div>
    </div>
  );
}
