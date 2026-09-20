"use client";

import Link from "next/link";
import { getPublicHipaaCertificateViewUrl } from "@/app/verify/hipaa-view-action";
import { HipaaCertificateViewTrigger } from "@/components/hipaa/hipaa-certificate-view-trigger";
import { Button } from "@/components/ui/button";
import { certificatesCopy } from "@/content/site";

type Props = {
  verifyCode: string;
  publicPortfolioSlug: string | null;
  hipaaApproved: boolean;
};

export function CertificateVerifyExtras({
  verifyCode,
  publicPortfolioSlug,
  hipaaApproved,
}: Props) {
  if (!publicPortfolioSlug && !hipaaApproved) return null;

  return (
    <div className="mx-auto mt-8 max-w-sm space-y-6 border-t border-navy/10 pt-6 text-left">
      {publicPortfolioSlug ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted">
            {certificatesCopy.verifyPortfolioLead}
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link
              href={`/portfolio/${publicPortfolioSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {certificatesCopy.verifyPortfolioCta}
            </Link>
          </Button>
        </div>
      ) : null}

      {hipaaApproved ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">
            {certificatesCopy.verifyHipaaApprovedLead}
          </p>
          <HipaaCertificateViewTrigger
            label={certificatesCopy.verifyHipaaViewCta}
            buttonVariant="secondary"
            buttonSize="default"
            className="w-full sm:w-auto"
            fetchAsset={() => getPublicHipaaCertificateViewUrl(verifyCode)}
          />
        </div>
      ) : null}
    </div>
  );
}
