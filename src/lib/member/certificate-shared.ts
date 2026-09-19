import {
  certificateGenerationAllowlistEmails,
  certificatesEnabled,
} from "@/content/site";

export function isCertificateAllowlistedEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return false;
  return certificateGenerationAllowlistEmails.some(
    (allowed) => allowed.toLowerCase() === normalized,
  );
}

/** Global flag, or allowlisted email when certificates are still gated. */
export function canGenerateCertificates(email?: string | null) {
  if (certificatesEnabled) return true;
  return isCertificateAllowlistedEmail(email);
}

/** Full course unlock + completion bypass for certificate testing (allowlist only). */
export function hasModuleCertificateBypass(email?: string | null) {
  return isCertificateAllowlistedEmail(email);
}

export type MemberCertificate = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  completedAt: string;
  certificateId: string;
};

export function courseCertificateHref(slug: string) {
  return `/member/modules/${slug}/certificate`;
}

export function certificateCode(enrollmentId: string) {
  return `BMVA-${enrollmentId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function formatCertificateDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
