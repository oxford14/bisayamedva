import Image from "next/image";
import { CertificateVerifyQr } from "@/components/member/certificate-verify-qr";
import { certificatesCopy } from "@/content/site";
import {
  formatCertificateDate,
  type MemberCertificate,
} from "@/lib/member/certificate-shared";

export function CourseCertificate({
  certificate,
  studentName,
}: {
  certificate: MemberCertificate;
  studentName: string;
}) {
  const completed = formatCertificateDate(certificate.completedAt);

  return (
    <article className="certificate-sheet relative mx-auto aspect-[11/8.5] w-full max-w-[68rem] overflow-hidden rounded-[1.25rem] bg-cream px-[6%] py-[5%] pr-[18%] shadow-[0_16px_40px_rgba(47,56,38,0.08)]">
      <Image
        src="/images/brand/certificate-seal-v3.webp"
        alt=""
        fill
        className="object-cover"
        sizes="1100px"
        priority
        unoptimized
      />
      <div className="relative flex h-full flex-col items-center justify-between text-center">
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-navy uppercase sm:text-xs">
            Bisaya MedVA
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl md:text-4xl">
            Certificate of Completion
          </h2>
        </div>

        <div>
          <p className="text-xs text-muted sm:text-sm">{certificatesCopy.certifies}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-navy sm:text-3xl md:text-4xl">
            {studentName}
          </p>
          <p className="mt-2 text-xs text-muted sm:text-sm">{certificatesCopy.completed}</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-ink sm:text-2xl">
            {certificate.title}
          </p>
          {certificate.subtitle ? (
            <p className="mt-0.5 text-[11px] text-muted sm:text-sm">{certificate.subtitle}</p>
          ) : null}
        </div>

        <dl className="grid w-full max-w-md grid-cols-2 gap-4 text-left">
          <div>
            <dt className="text-[10px] font-semibold tracking-[0.14em] text-navy/70 uppercase">
              {certificatesCopy.dateLabel}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{completed}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold tracking-[0.14em] text-navy/70 uppercase">
              {certificatesCopy.idLabel}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {certificate.certificateId}
            </dd>
          </div>
        </dl>

        <div className="flex w-full max-w-xs flex-col items-center">
          <div className="h-px w-36 bg-navy/30" />
          <p className="mt-1 font-display text-base font-semibold text-ink">
            {certificatesCopy.signatoryName}
          </p>
          <p className="text-[10px] font-medium tracking-wide text-muted">
            {certificatesCopy.signatoryTitle}
          </p>
        </div>

        <CertificateVerifyQr certificateId={certificate.certificateId} compact />

        <p className="text-[10px] font-semibold tracking-[0.2em] text-navy uppercase sm:text-xs">
          {certificatesCopy.issued}
        </p>
      </div>
    </article>
  );
}
