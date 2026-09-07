import Link from "next/link";
import { Award } from "lucide-react";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { certificatesCopy } from "@/content/site";
import {
  formatCertificateDate,
  getMemberCertificates,
} from "@/lib/member/certificates";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberCertificatesPage() {
  const profile = await getStudentProfile();
  const certificates = await getMemberCertificates(profile.id);

  return (
    <div>
      <MemberPageHeader
        title={certificatesCopy.title}
        description={certificatesCopy.description}
      />

      {certificates.length === 0 ? (
        <MemberEmptyState
          title={certificatesCopy.emptyTitle}
          body={certificatesCopy.emptyBody}
          action={
            <Button variant="accent" asChild>
              <Link href="/member/modules">{certificatesCopy.emptyCta}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <MemberCard key={certificate.enrollmentId}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                    <Award className="size-3.5" aria-hidden />
                    {certificate.certificateId}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                    {certificate.title}
                  </h2>
                  {certificate.subtitle ? (
                    <p className="mt-1 text-sm text-muted">
                      {certificate.subtitle}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-muted">
                    {certificatesCopy.dateLabel}:{" "}
                    {formatCertificateDate(certificate.completedAt)}
                  </p>
                </div>
                <Button variant="accent" asChild>
                  <Link href={`/member/certificates/${certificate.slug}`}>
                    {certificatesCopy.view}
                  </Link>
                </Button>
              </div>
            </MemberCard>
          ))}
        </div>
      )}
    </div>
  );
}
