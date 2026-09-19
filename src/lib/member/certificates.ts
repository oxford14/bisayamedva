import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { getMemberEnrollments } from "@/lib/member/data";
import { courseReadyForCertificate } from "@/lib/member/hipaa-gate";
import {
  getCoursePlayerState,
  type CoursePlayerState,
  type PlayerOutlineItem,
} from "@/lib/member/module-player";
import { isAdminRole, type UserRole } from "@/lib/supabase/roles";
import {
  certificateCode,
  courseCertificateHref,
  hasModuleCertificateBypass,
  type MemberCertificate,
} from "@/lib/member/certificate-shared";

export type { MemberCertificate };
export {
  certificateCode,
  courseCertificateHref,
  formatCertificateDate,
} from "@/lib/member/certificate-shared";

export function courseItemsComplete(state: CoursePlayerState) {
  if (state.access.staffPreview) return false;
  return Boolean(
    state.course &&
      state.flat.length > 0 &&
      courseReadyForCertificate(state.flat, state.hipaa),
  );
}

async function latestCompletionAt(studentId: string, moduleIds: string[]) {
  if (moduleIds.length === 0) return new Date().toISOString();
  const admin = createServiceClient();
  const { data } = await admin
    .from("course_module_item_completions")
    .select("completed_at")
    .eq("student_id", studentId)
    .in("module_id", moduleIds)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.completed_at as string | undefined) ?? new Date().toISOString();
}

export async function ensureCourseEnrollment(
  studentId: string,
  courseId: string,
) {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("enrollments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) {
    if (existing.status !== "ACTIVE" && existing.status !== "COMPLETED") {
      const ok = await activateEnrollment(existing.id as string);
      if (!ok) return null;
      return { id: existing.id, status: "ACTIVE" };
    }
    return existing;
  }

  const { data: created, error } = await admin
    .from("enrollments")
    .insert({
      student_id: studentId,
      course_id: courseId,
      session_id: null,
      status: "ACTIVE",
    })
    .select("id, status")
    .single();
  if (error || !created) return null;
  return created;
}

export async function recordItemCompletions(
  studentId: string,
  items: Pick<PlayerOutlineItem, "kind" | "moduleId" | "itemId">[],
) {
  const qualifying = items.filter(
    (item) => item.kind === "FILE" || item.kind === "QUIZ",
  );
  if (qualifying.length === 0) return;
  const admin = createServiceClient();
  await admin.from("course_module_item_completions").upsert(
    qualifying.map((item) => ({
      student_id: studentId,
      module_id: item.moduleId,
      item_kind: item.kind,
      item_id: item.itemId,
    })),
    { onConflict: "student_id,item_kind,item_id", ignoreDuplicates: true },
  );
}

export function revalidateCertificatePaths(slug?: string | null) {
  revalidatePath("/member");
  revalidatePath("/member/course");
  revalidatePath("/member/certificates");
  revalidatePath("/member/modules");
  if (slug) {
    revalidatePath(`/member/certificates/${slug}`);
    revalidatePath(courseCertificateHref(slug));
  }
}

export async function maybeCompleteEnrollment(
  studentId: string,
  courseId: string,
  state: CoursePlayerState,
) {
  if (!courseItemsComplete(state)) return false;

  const admin = createServiceClient();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment || enrollment.status !== "ACTIVE") return false;

  const { error } = await admin
    .from("enrollments")
    .update({ status: "COMPLETED" })
    .eq("id", enrollment.id);
  if (error) return false;
  return true;
}

async function certificateFromState(
  studentId: string,
  enrollmentId: string,
  state: CoursePlayerState,
): Promise<MemberCertificate | null> {
  if (!state.course || !courseItemsComplete(state)) return null;
  await maybeCompleteEnrollment(studentId, state.course.id, state);
  const completedAt = await latestCompletionAt(
    studentId,
    state.outline.map((lesson) => lesson.id),
  );
  return {
    enrollmentId,
    courseId: state.course.id,
    slug: state.course.slug,
    title: state.course.title,
    subtitle: state.course.subtitle,
    completedAt,
    certificateId: certificateCode(enrollmentId),
  };
}

export async function getMemberCertificates(
  studentId: string,
  email?: string | null,
) {
  const enrollments = await getMemberEnrollments(studentId);
  const qualifying = enrollments.filter(
    (enrollment) =>
      (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED") &&
      enrollment.course?.slug,
  );

  const certificates: MemberCertificate[] = [];
  for (const enrollment of qualifying) {
    const slug = enrollment.course?.slug;
    if (!slug) continue;
    const state = await getCoursePlayerState(studentId, slug, "STUDENT", email);
    const certificate = await certificateFromState(
      studentId,
      enrollment.id,
      state,
    );
    if (certificate) certificates.push(certificate);
  }

  return certificates.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
}

export async function getMemberCertificate(
  studentId: string,
  slug: string,
  email?: string | null,
) {
  const enrollments = await getMemberEnrollments(studentId);
  const enrollment = enrollments.find(
    (item) =>
      item.course?.slug === slug &&
      (item.status === "ACTIVE" || item.status === "COMPLETED"),
  );
  if (!enrollment) return null;

  const state = await getCoursePlayerState(studentId, slug, "STUDENT", email);
  return certificateFromState(studentId, enrollment.id, state);
}

async function activateEnrollment(enrollmentId: string) {
  const admin = createServiceClient();
  const { error } = await admin
    .from("enrollments")
    .update({ status: "ACTIVE" })
    .eq("id", enrollmentId);
  return !error;
}

async function markEnrollmentCompleted(enrollmentId: string) {
  const admin = createServiceClient();
  const { error } = await admin
    .from("enrollments")
    .update({ status: "COMPLETED" })
    .eq("id", enrollmentId)
    .eq("status", "ACTIVE");
  return !error;
}

export async function ensureMemberCertificate(
  studentId: string,
  slug: string,
  role: UserRole,
  email?: string | null,
): Promise<MemberCertificate | null> {
  const previewState = await getCoursePlayerState(studentId, slug, role, email);
  if (!previewState.course || previewState.flat.length === 0) return null;

  let enrollmentId = previewState.access.enrollmentId;
  let state = previewState;

  const bootstrapCertificate =
    isAdminRole(role) || hasModuleCertificateBypass(email);

  if (bootstrapCertificate) {
    const enrollment = await ensureCourseEnrollment(
      studentId,
      previewState.course.id,
    );
    if (!enrollment) return null;
    enrollmentId = enrollment.id;
    await recordItemCompletions(studentId, previewState.flat);
    if (enrollment.status === "ACTIVE") {
      await markEnrollmentCompleted(enrollment.id);
    }
    state = {
      ...previewState,
      access: {
        ...previewState.access,
        enrolled: true,
        unlocked: true,
        enrollmentId,
        staffPreview: false,
      },
      flat: previewState.flat.map((item) => ({ ...item, complete: true })),
    };
  }

  if (!enrollmentId || !state.course) return null;
  if (!courseItemsComplete(state)) return null;

  return certificateFromState(studentId, enrollmentId, state);
}
