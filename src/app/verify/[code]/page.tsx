import type { Metadata } from "next";
import Image from "next/image";
import { CertificateVerifyReveal } from "@/components/member/certificate-verify-reveal";
import { certificatesCopy } from "@/content/site";
import { formatCertificateDate } from "@/lib/member/certificate-shared";
import { getPublicCertificateByCode } from "@/lib/member/certificate-verify";

type Props = {
  params: Promise<{ code: string }>;
};

export const metadata: Metadata = {
  title: "Certificate verification",
  robots: { index: false, follow: false },
};

export default async function CertificateVerifyPage({ params }: Props) {
  const { code } = await params;
  const certificate = await getPublicCertificateByCode(code);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4 py-12">
      <CertificateVerifyReveal>
        <div className="w-full rounded-[1.5rem] border border-navy/15 bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(47,56,38,0.08)] sm:px-10">
          <span className="mx-auto flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-navy/10 bg-cream">
            <Image
              src="/images/brand/logo-mark.png"
              alt=""
              width={56}
              height={56}
              className="size-10 object-contain"
            />
          </span>
          {certificate ? (
            <>
              <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-navy/50 uppercase">
                Bisaya MedVA
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-navy">
                {certificatesCopy.authenticTitle}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {certificatesCopy.authenticBody}
              </p>
              <p className="mt-6 font-display text-2xl font-semibold text-ink">
                {certificate.studentName}
              </p>
              <p className="mt-1 text-sm text-muted">{certificatesCopy.completed}</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                {certificate.title}
              </p>
              {certificate.subtitle ? (
                <p className="mt-1 text-sm text-muted">{certificate.subtitle}</p>
              ) : null}
              <dl className="mx-auto mt-6 grid max-w-sm gap-3 text-left sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                    {certificatesCopy.dateLabel}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {formatCertificateDate(certificate.completedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                    {certificatesCopy.idLabel}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {certificate.certificateId}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <h1 className="mt-5 font-display text-3xl font-semibold text-ink">
                {certificatesCopy.unverifiedTitle}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {certificatesCopy.unverifiedBody}
              </p>
            </>
          )}
        </div>
      </CertificateVerifyReveal>
    </div>
  );
}
