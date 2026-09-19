import Image from "next/image";
import { CertificateVerifyQr } from "@/components/member/certificate-verify-qr";
import { certificatesCopy } from "@/content/site";
import {
  CERTIFICATE_TEMPLATE_SRC,
  certificateCompletionParagraph,
} from "@/lib/member/certificate-layout";
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
  const programTitle =
    certificate.title || certificatesCopy.certificateProgramLine;
  const completionText = certificateCompletionParagraph(
    programTitle,
    certificate.slug,
  );

  return (
    <article className="certificate-sheet relative mx-auto aspect-[3300/2550] w-full max-w-[68rem] overflow-hidden rounded-[1.25rem] shadow-[0_16px_40px_rgba(47,56,38,0.08)]">
      <Image
        src={CERTIFICATE_TEMPLATE_SRC}
        alt=""
        fill
        className="object-cover"
        sizes="1100px"
        priority
        unoptimized
      />
      <div className="relative flex h-full flex-col px-[6%] pb-[8%] pt-[39%] text-center">
        <div className="mx-auto max-w-[62%] flex-1">
          <p className="text-[clamp(0.65rem,1.2vw,0.85rem)] text-[#5A664F]">
            {certificatesCopy.certifies}
          </p>
          <p className="mt-1.5 font-display text-[clamp(1.35rem,3.2vw,2.25rem)] font-semibold text-[#2D4A22]">
            {studentName}
          </p>
          <p className="mt-3 text-[clamp(0.6rem,1.05vw,0.8rem)] leading-relaxed text-[#5A664F]">
            {completionText}
          </p>
          <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-left">
            <div>
              <dt className="text-[10px] font-semibold tracking-[0.14em] text-[#2D4A22]/70 uppercase">
                {certificatesCopy.dateLabel}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-[#2F3826]">
                {completed}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold tracking-[0.14em] text-[#2D4A22]/70 uppercase">
                {certificatesCopy.idLabel}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-[#2F3826]">
                {certificate.certificateId}
              </dd>
            </div>
          </dl>
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute bottom-[5%] left-[4.5%]">
            <CertificateVerifyQr
              certificateId={certificate.certificateId}
              compact
              size={112}
            />
          </div>
          <div className="absolute bottom-[12%] right-[14%] flex w-[14%] flex-col items-center text-center">
            {certificatesCopy.signatureImageSrc ? (
              <>
                <Image
                  src={certificatesCopy.signatureImageSrc}
                  alt=""
                  width={200}
                  height={80}
                  className="mb-0.5 h-auto w-full object-contain"
                  unoptimized
                />
                <p className="font-display text-sm font-semibold leading-tight text-[#2F3826]">
                  {certificatesCopy.signatoryName}
                </p>
              </>
            ) : (
              <>
                <div className="h-px w-full bg-[#2D4A22]/30" />
                <p className="mt-1 font-display text-sm font-semibold text-[#2F3826]">
                  {certificatesCopy.signatoryName}
                </p>
              </>
            )}
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-[#5A664F]">
              {certificatesCopy.signatoryTitle}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
