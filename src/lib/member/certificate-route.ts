import { certificatesCopy } from "@/content/site";
import {
  canGenerateCertificates,
  courseCertificateHref,
} from "@/lib/member/certificate-shared";
import {
  courseReadyForCertificate,
  hipaaStepHref,
  type HipaaGateState,
} from "@/lib/member/hipaa-gate";
import type { PlayerOutlineItem } from "@/lib/member/module-player-shared";

export type CertificateContinue =
  | { kind: "certificate"; href: string }
  | { kind: "hipaa_upload"; href: string }
  | { kind: "hipaa_pending" }
  | { kind: "unavailable" }
  | { kind: "next"; href: string | null };

export function resolveAfterLastItem(input: {
  courseSlug: string;
  flat: PlayerOutlineItem[];
  hipaa: HipaaGateState;
  nextHref: string | null;
  isLast: boolean;
  email?: string | null;
}): CertificateContinue {
  if (!input.isLast) {
    return { kind: "next", href: input.nextHref };
  }
  if (!canGenerateCertificates(input.email)) {
    return { kind: "unavailable" };
  }
  if (courseReadyForCertificate(input.flat, input.hipaa)) {
    return { kind: "certificate", href: courseCertificateHref(input.courseSlug) };
  }
  if (input.hipaa.required && !input.hipaa.approved) {
    if (!input.hipaa.submitted) {
      return { kind: "hipaa_upload", href: hipaaStepHref(input.courseSlug) };
    }
    return { kind: "hipaa_pending" };
  }
  return { kind: "next", href: input.nextHref };
}

export function certificateBlockedCopy(kind: CertificateContinue["kind"]) {
  if (kind === "hipaa_pending") {
    return {
      title: certificatesCopy.hipaaBlockedTitle,
      body: certificatesCopy.hipaaBlockedPendingBody,
    };
  }
  if (kind === "hipaa_upload") {
    return {
      title: certificatesCopy.hipaaBlockedTitle,
      body: certificatesCopy.hipaaBlockedBody,
    };
  }
  return null;
}
