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
