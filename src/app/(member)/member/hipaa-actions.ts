"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ensureHipaaCertificatesBucket,
  HIPAA_CERTIFICATES_BUCKET,
  hipaaCertificateObjectPath,
  isHipaaStorageInfrastructureError,
  validateHipaaCertificateFile,
} from "@/lib/hipaa/storage";
import { hipaaCopy } from "@/content/site";
import {
  courseRequiresHipaaGate,
  hipaaStepHref,
} from "@/lib/member/hipaa-gate";
import { getCoursePlayerState } from "@/lib/member/module-player";
import { revalidateCertificatePaths } from "@/lib/member/certificates";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdminRole, requireStudent } from "@/lib/supabase/auth";

const uuid = z.guid();

function fail(message: string) {
  return { ok: false as const, error: message };
}

function mapUploadError(message: string) {
  if (isHipaaStorageInfrastructureError(message)) {
    return hipaaCopy.uploadStorageError;
  }
  return message;
}

async function requireUnlockedHipaaStep(studentId: string, slug: string, role: string) {
  const state = await getCoursePlayerState(
    studentId,
    slug,
    isAdminRole(role) ? role : "STUDENT",
  );
  if (!state.course || !courseRequiresHipaaGate(slug)) {
    return { ok: false as const, error: "HIPAA step not available for this course." };
  }
  const hipaaItem = state.flat.find((item) => item.kind === "HIPAA");
  if (!hipaaItem) {
    return { ok: false as const, error: "Finish Module 8 una before HIPAA upload." };
  }
  if (hipaaItem.locked && !isAdminRole(role)) {
    return {
      ok: false as const,
      error: "Locked pa ni. Finish Module 8 una.",
    };
  }
  if (state.hipaa.approved) {
    return { ok: false as const, error: "HIPAA certificate approved na." };
  }
  return { ok: true as const, state };
}

export async function prepareHipaaCertificateUpload(input: {
  courseSlug: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
}) {
  const profile = await requireStudent();
  const opened = await requireUnlockedHipaaStep(
    profile.id,
    input.courseSlug,
    profile.role,
  );
  if (!opened.ok) return opened;

  const invalid = validateHipaaCertificateFile(input.mimeType, input.byteSize);
  if (invalid) return fail(invalid);

  const courseId = opened.state.course!.id;
  const path = hipaaCertificateObjectPath(courseId, profile.id, input.fileName);
  const service = createServiceClient();
  const ensureError = await ensureHipaaCertificatesBucket(service);
  if (ensureError) {
    return fail(mapUploadError(ensureError));
  }
  const { data, error } = await service.storage
    .from(HIPAA_CERTIFICATES_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return fail(mapUploadError(error?.message ?? "Could not prepare upload."));
  }

  return {
    ok: true as const,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export async function confirmHipaaCertificateUpload(input: {
  courseSlug: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
}) {
  const profile = await requireStudent();
  const opened = await requireUnlockedHipaaStep(
    profile.id,
    input.courseSlug,
    profile.role,
  );
  if (!opened.ok) return opened;

  const invalid = validateHipaaCertificateFile(input.mimeType, input.byteSize);
  if (invalid) return fail(invalid);

  const courseId = opened.state.course!.id;
  const prefix = `${courseId}/${profile.id}/`;
  if (!input.storagePath.startsWith(prefix)) {
    return fail("Invalid storage path.");
  }

  const service = createServiceClient();
  const { data: existing } = await service
    .from("hipaa_certificate_submissions")
    .select("id, storage_path, status")
    .eq("student_id", profile.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing?.status === "APPROVED") {
    return fail("Approved na — dili na pwede i-replace.");
  }

  const payload = {
    student_id: profile.id,
    course_id: courseId,
    storage_path: input.storagePath,
    file_name: input.fileName,
    mime_type: input.mimeType.split(";")[0]?.trim() ?? input.mimeType,
    byte_size: input.byteSize,
    status: "PENDING" as const,
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    submitted_at: new Date().toISOString(),
  };

  const { error: upsertError } = await service
    .from("hipaa_certificate_submissions")
    .upsert(payload, { onConflict: "student_id,course_id" });
  if (upsertError) return fail(mapUploadError(upsertError.message));

  if (
    existing?.storage_path &&
    existing.storage_path !== input.storagePath
  ) {
    await service.storage
      .from(HIPAA_CERTIFICATES_BUCKET)
      .remove([existing.storage_path as string]);
  }

  revalidatePath(hipaaStepHref(input.courseSlug));
  revalidatePath(`/member/modules/${input.courseSlug}`);
  revalidateCertificatePaths(input.courseSlug);
  return { ok: true as const };
}

export async function getOwnHipaaCertificateViewUrl(courseSlug: string) {
  const profile = await requireStudent();
  if (!courseRequiresHipaaGate(courseSlug)) return fail("Invalid course.");

  const admin = createServiceClient();
  const { data: course } = await admin
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .maybeSingle();
  if (!course) return fail("Course not found.");

  const { data: row } = await admin
    .from("hipaa_certificate_submissions")
    .select("storage_path, file_name, mime_type, status")
    .eq("student_id", profile.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!row?.storage_path) return fail("No upload yet.");

  const { data: signed, error } = await admin.storage
    .from(HIPAA_CERTIFICATES_BUCKET)
    .createSignedUrl(row.storage_path as string, 3600);
  if (error || !signed) return fail(error?.message ?? "Could not open file.");
  return {
    ok: true as const,
    url: signed.signedUrl,
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
    status: row.status as string,
  };
}

export async function deleteOwnHipaaCertificateUpload(courseSlug: string) {
  const profile = await requireStudent();
  if (!courseRequiresHipaaGate(courseSlug)) return fail("Invalid course.");

  const admin = createServiceClient();
  const { data: course } = await admin
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .maybeSingle();
  if (!course) return fail("Course not found.");

  const { data: row } = await admin
    .from("hipaa_certificate_submissions")
    .select("id, storage_path, status")
    .eq("student_id", profile.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!row) return fail("No upload to delete.");
  if (row.status === "APPROVED") {
    return fail("Approved na — dili na pwede i-delete.");
  }

  if (row.storage_path) {
    await admin.storage
      .from(HIPAA_CERTIFICATES_BUCKET)
      .remove([row.storage_path as string]);
  }

  const { error } = await admin
    .from("hipaa_certificate_submissions")
    .delete()
    .eq("id", row.id);
  if (error) return fail(mapUploadError(error.message));

  revalidatePath(hipaaStepHref(courseSlug));
  revalidatePath(`/member/modules/${courseSlug}`);
  revalidateCertificatePaths(courseSlug);
  return { ok: true as const };
}
