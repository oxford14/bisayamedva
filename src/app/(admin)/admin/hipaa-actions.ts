"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HIPAA_CERTIFICATES_BUCKET } from "@/lib/hipaa/storage";
import { revalidateCertificatePaths } from "@/lib/member/certificates";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

const uuid = z.guid();

function fail(message: string) {
  return { ok: false as const, error: message };
}

export async function reviewHipaaCertificateSubmission(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNote = String(formData.get("review_note") ?? "").trim() || null;

  if (!uuid.safeParse(id).success) return fail("Invalid submission.");
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return fail("Invalid decision.");
  }

  const service = createServiceClient();
  const { data: row } = await service
    .from("hipaa_certificate_submissions")
    .select("id, course_id, status, courses(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Submission not found.");
  if (row.status === "APPROVED" && decision === "REJECTED") {
    return fail("Approved submission — contact dev if you need to revert.");
  }

  const { error } = await service
    .from("hipaa_certificate_submissions")
    .update({
      status: decision,
      review_note: reviewNote,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return fail(error.message);

  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  const slug = course?.slug as string | undefined;
  revalidatePath("/admin/hipaa-certificates");
  if (slug) {
    revalidatePath(`/member/modules/${slug}/hipaa`);
    revalidatePath(`/member/modules/${slug}`);
    revalidateCertificatePaths(slug);
  }
  return { ok: true as const };
}

export async function getHipaaCertificateAdminViewUrl(submissionId: string) {
  await requireAdmin();
  if (!uuid.safeParse(submissionId).success) return fail("Invalid submission.");

  const service = createServiceClient();
  const { data: row } = await service
    .from("hipaa_certificate_submissions")
    .select("storage_path, file_name, mime_type")
    .eq("id", submissionId)
    .maybeSingle();
  if (!row?.storage_path) return fail("File not found.");

  const { data: signed, error } = await service.storage
    .from(HIPAA_CERTIFICATES_BUCKET)
    .createSignedUrl(row.storage_path as string, 3600);
  if (error || !signed) return fail(error?.message ?? "Could not open file.");
  return {
    ok: true as const,
    url: signed.signedUrl,
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
  };
}
