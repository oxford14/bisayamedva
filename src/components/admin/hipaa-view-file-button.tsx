"use client";

import { getHipaaCertificateAdminViewUrl } from "@/app/(admin)/admin/hipaa-actions";
import { HipaaCertificateViewTrigger } from "@/components/hipaa/hipaa-certificate-view-trigger";
import { hipaaCopy } from "@/content/site";

export function HipaaViewFileButton({ submissionId }: { submissionId: string }) {
  return (
    <HipaaCertificateViewTrigger
      label={hipaaCopy.adminViewFile}
      fetchAsset={async () => {
        const result = await getHipaaCertificateAdminViewUrl(submissionId);
        if (!result.ok) return result;
        return {
          ok: true as const,
          url: result.url,
          mimeType: result.mimeType,
          fileName: result.fileName,
        };
      }}
    />
  );
}
