import { hipaaCopy } from "@/content/site";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PlayerOutlineItem,
  PlayerOutlineModule,
} from "@/lib/member/module-player-shared";

export const HIPAA_GATE_COURSE_SLUG = "medical-va-masterclass";
export const HIPAA_GATE_MODULE_ID = "hipaa-gate";
export const HIPAA_EXTERNAL_URL = "https://hipaatraining.us/#module1";

export type HipaaSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type HipaaSubmissionRow = {
  id: string;
  status: HipaaSubmissionStatus;
  review_note: string | null;
  file_name: string;
  mime_type: string;
  submitted_at: string;
};

export type HipaaGateState = {
  required: boolean;
  approved: boolean;
  submitted: boolean;
  rejected: boolean;
  reviewNote: string | null;
  submission: HipaaSubmissionRow | null;
};

export function hipaaStepHref(slug: string) {
  return `/member/modules/${slug}/hipaa`;
}

export function courseRequiresHipaaGate(slug: string | null | undefined) {
  return slug === HIPAA_GATE_COURSE_SLUG;
}

export function matchTriggerModule(title: string, moduleId?: string) {
  const envId = process.env.HIPAA_AFTER_MODULE_ID?.trim();
  if (envId && moduleId) return moduleId === envId;
  return /\bModule 8\b/i.test(title);
}

export function emptyHipaaGateState(required: boolean): HipaaGateState {
  return {
    required,
    approved: false,
    submitted: false,
    rejected: false,
    reviewNote: null,
    submission: null,
  };
}

export function hipaaGateFromSubmission(
  required: boolean,
  submission: HipaaSubmissionRow | null,
): HipaaGateState {
  if (!required) return emptyHipaaGateState(false);
  const status = submission?.status;
  return {
    required: true,
    approved: status === "APPROVED",
    submitted: status === "PENDING" || status === "APPROVED",
    rejected: status === "REJECTED",
    reviewNote: submission?.review_note ?? null,
    submission,
  };
}

export function hipaaItemKey() {
  return "hipaa";
}

export function buildHipaaOutlineItem(
  courseSlug: string,
  gate: HipaaGateState,
): PlayerOutlineItem {
  return {
    key: hipaaItemKey(),
    kind: "HIPAA",
    moduleId: HIPAA_GATE_MODULE_ID,
    itemId: HIPAA_GATE_MODULE_ID,
    title: hipaaCopy.stepTitle,
    label: "Certificate",
    complete: gate.submitted,
    locked: false,
    href: hipaaStepHref(courseSlug),
  };
}

export function findHipaaFlatInsertIndex(
  flat: PlayerOutlineItem[],
  outline: PlayerOutlineModule[],
): number | null {
  const triggerModule = outline.find((lesson) =>
    matchTriggerModule(lesson.title, lesson.id),
  );
  if (!triggerModule) return null;

  let lastIndex = -1;
  for (let i = 0; i < flat.length; i++) {
    if (flat[i]!.moduleId === triggerModule.id) lastIndex = i;
  }
  if (lastIndex < 0) return null;
  return lastIndex + 1;
}

export function findHipaaOutlineInsertIndex(outline: PlayerOutlineModule[]) {
  const triggerIndex = outline.findIndex((lesson) =>
    matchTriggerModule(lesson.title, lesson.id),
  );
  if (triggerIndex < 0) return null;
  return triggerIndex + 1;
}

export function applySequentialLocks(flat: PlayerOutlineItem[], courseOpen: boolean) {
  if (!courseOpen) {
    for (const item of flat) item.locked = true;
    return;
  }
  let previousComplete = true;
  for (const item of flat) {
    item.locked = !previousComplete;
    if (!item.complete) previousComplete = false;
  }
}

export function syncOutlineLocks(outline: PlayerOutlineModule[]) {
  for (const lesson of outline) {
    lesson.locked = lesson.items[0]?.locked === true;
  }
}

export function injectHipaaIntoPlayerOutline(input: {
  courseSlug: string;
  outline: PlayerOutlineModule[];
  flat: PlayerOutlineItem[];
  gate: HipaaGateState;
}) {
  if (!input.gate.required) return;

  const flatIndex = findHipaaFlatInsertIndex(input.flat, input.outline);
  const outlineIndex = findHipaaOutlineInsertIndex(input.outline);
  if (flatIndex == null || outlineIndex == null) return;

  const hipaaItem = buildHipaaOutlineItem(input.courseSlug, input.gate);
  const hipaaLesson: PlayerOutlineModule = {
    id: HIPAA_GATE_MODULE_ID,
    title: hipaaCopy.outlineModuleTitle,
    description: null,
    status: "PUBLISHED",
    locked: false,
    items: [hipaaItem],
  };

  input.flat.splice(flatIndex, 0, hipaaItem);
  input.outline.splice(outlineIndex, 0, hipaaLesson);
}

export function allCourseItemsComplete(flat: PlayerOutlineItem[]) {
  return flat.length > 0 && flat.every((item) => item.complete);
}

export function courseReadyForCertificate(
  flat: PlayerOutlineItem[],
  gate: HipaaGateState,
) {
  return allCourseItemsComplete(flat) && (!gate.required || gate.approved);
}

export async function fetchHipaaSubmission(
  admin: SupabaseClient,
  studentId: string,
  courseId: string,
): Promise<HipaaSubmissionRow | null> {
  const { data } = await admin
    .from("hipaa_certificate_submissions")
    .select("id, status, review_note, file_name, mime_type, submitted_at")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    status: data.status as HipaaSubmissionStatus,
    review_note: (data.review_note as string | null) ?? null,
    file_name: data.file_name as string,
    mime_type: data.mime_type as string,
    submitted_at: data.submitted_at as string,
  };
}
