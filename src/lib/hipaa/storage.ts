import type { SupabaseClient } from "@supabase/supabase-js";

export const HIPAA_CERTIFICATES_BUCKET = "hipaa-certificates";

export const HIPAA_CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;

export const HIPAA_BUCKET_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateHipaaCertificateFile(mimeType: string, byteSize: number) {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_MIME.has(normalized)) {
    return "PDF or image lang (JPG, PNG, WebP).";
  }
  if (byteSize <= 0) return "Empty file.";
  if (byteSize > HIPAA_CERTIFICATE_MAX_BYTES) {
    return "File too large — max 10MB.";
  }
  return null;
}

export function hipaaCertificateObjectPath(
  courseId: string,
  studentId: string,
  fileName: string,
) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "certificate";
  return `${courseId}/${studentId}/${crypto.randomUUID()}-${safe}`;
}

export function hipaaCertificateAcceptAttribute() {
  return ".pdf,application/pdf,image/jpeg,image/png,image/webp";
}

export function isHipaaStorageInfrastructureError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("related resource does not exist") ||
    lower.includes("bucket not found") ||
    lower.includes("hipaa_certificate_submissions") ||
    lower.includes("schema cache")
  );
}

export async function ensureHipaaCertificatesBucket(
  service: SupabaseClient,
): Promise<string | null> {
  const { data: bucket } = await service.storage.getBucket(
    HIPAA_CERTIFICATES_BUCKET,
  );
  if (bucket) return null;

  const { error: createError } = await service.storage.createBucket(
    HIPAA_CERTIFICATES_BUCKET,
    {
      public: false,
      fileSizeLimit: HIPAA_CERTIFICATE_MAX_BYTES,
      allowedMimeTypes: [...HIPAA_BUCKET_ALLOWED_MIME_TYPES],
    },
  );
  if (createError) return createError.message;
  return null;
}
