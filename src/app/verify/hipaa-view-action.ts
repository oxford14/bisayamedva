"use server";

import { certificatesCopy } from "@/content/site";
import {
  getApprovedHipaaFileForVerifiedEnrollment,
  resolveVerifiedEnrollmentFromCode,
} from "@/lib/member/certificate-verify";
import { HIPAA_CERTIFICATES_BUCKET } from "@/lib/hipaa/storage";
import { createServiceClient } from "@/lib/supabase/admin";

const SIGNED_URL_TTL_SEC = 3600;

export async function getPublicHipaaCertificateViewUrl(code: string) {
  const verified = await resolveVerifiedEnrollmentFromCode(code);
  if (!verified) {
    return { ok: false as const, error: certificatesCopy.verifyHipaaViewError };
  }

  const file = await getApprovedHipaaFileForVerifiedEnrollment(verified);
  if (!file) {
    return { ok: false as const, error: certificatesCopy.verifyHipaaViewError };
  }

  const admin = createServiceClient();
  const { data: signed, error } = await admin.storage
    .from(HIPAA_CERTIFICATES_BUCKET)
    .createSignedUrl(file.storagePath, SIGNED_URL_TTL_SEC);

  if (error || !signed?.signedUrl) {
    console.error("getPublicHipaaCertificateViewUrl", error?.message);
    return { ok: false as const, error: certificatesCopy.verifyHipaaViewError };
  }

  return {
    ok: true as const,
    url: signed.signedUrl,
    mimeType: file.mimeType,
    fileName: file.fileName,
  };
}
