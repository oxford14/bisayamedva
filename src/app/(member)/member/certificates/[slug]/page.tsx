import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateViewer } from "@/components/member/certificate-viewer";
import { MemberPageHeader } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { certificatesCopy } from "@/content/site";
import { getMemberCertificate } from "@/lib/member/certificates";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberCertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getStudentProfile();
  const certificate = await getMemberCertificate(profile.id, slug);

  if (!certificate) {
    notFound();
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
        />
      </div>
    </div>
  );
}
