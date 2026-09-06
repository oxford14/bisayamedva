"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  MODULE_FILES_BUCKET,
  moduleObjectPath,
  sanitizeModuleFileName,
  validateModuleFile,
} from "@/lib/modules/storage";

function fail(message: string) {
  return { ok: false as const, error: message };
}
function ok() {
  return { ok: true as const };
}

const uuid = z.guid();

const moduleSchema = z.object({
  id: uuid.optional(),
  course_id: uuid,
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

function revalidateModules(moduleId?: string) {
  revalidatePath("/admin/modules");
  revalidatePath("/member/modules");
  if (moduleId) {
    revalidatePath(`/admin/modules/${moduleId}`);
  }
}

export async function upsertCourseModule(formData: FormData) {
  await requireAdmin();
  const parsed = moduleSchema.safeParse({
    id: formData.get("id") || undefined,
    course_id: formData.get("course_id"),
    title: formData.get("title"),
    description: String(formData.get("description") ?? "").trim() || null,
    sort_order: formData.get("sort_order") || 0,
    status: formData.get("status"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid module");

  const supabase = await createClient();
  const payload = parsed.data;
  if (payload.id) {
    const { error } = await supabase
      .from("course_modules")
      .update({
        course_id: payload.course_id,
        title: payload.title,
        description: payload.description,
        sort_order: payload.sort_order,
        status: payload.status,
      })
      .eq("id", payload.id);
    if (error) return fail(error.message);
    revalidateModules(payload.id);
    return { ok: true as const, id: payload.id };
  }

  const { data, error } = await supabase
    .from("course_modules")
    .insert({
      course_id: payload.course_id,
      title: payload.title,
      description: payload.description,
      sort_order: payload.sort_order,
      status: payload.status,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create module.");
  revalidateModules(data.id);
  return { ok: true as const, id: data.id as string };
}

export async function deleteCourseModule(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return fail("Invalid module.");

  const admin = createServiceClient();
  const { data: files } = await admin
    .from("course_module_files")
    .select("storage_path")
    .eq("module_id", id);
  const paths = (files ?? []).map((row) => row.storage_path as string).filter(Boolean);
  if (paths.length > 0) {
    await admin.storage.from(MODULE_FILES_BUCKET).remove(paths);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("course_modules").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateModules();
  redirect("/admin/modules");
}

export async function prepareModuleFileUpload(input: {
  moduleId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
}) {
  await requireAdmin();
  const moduleId = uuid.safeParse(input.moduleId);
  if (!moduleId.success) return fail("Invalid module.");

  const invalid = validateModuleFile(input.mimeType, input.byteSize);
  if (invalid) return fail(invalid);

  const supabase = await createClient();
  const { data: module, error } = await supabase
    .from("course_modules")
    .select("id, course_id")
    .eq("id", moduleId.data)
    .maybeSingle();
  if (error || !module) return fail("Module not found.");

  const path = moduleObjectPath(
    module.course_id as string,
    module.id as string,
    input.fileName,
  );
  const service = createServiceClient();
  const { data, error: signError } = await service.storage
    .from(MODULE_FILES_BUCKET)
    .createSignedUploadUrl(path);
  if (signError || !data) {
    return fail(signError?.message ?? "Could not prepare upload.");
  }

  return {
    ok: true as const,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export async function confirmModuleFileUpload(input: {
  moduleId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
}) {
  await requireAdmin();
  const moduleId = uuid.safeParse(input.moduleId);
  if (!moduleId.success) return fail("Invalid module.");

  const invalid = validateModuleFile(input.mimeType, input.byteSize);
  if (invalid) return fail(invalid);

  const supabase = await createClient();
  const { data: module } = await supabase
    .from("course_modules")
    .select("id, course_id")
    .eq("id", moduleId.data)
    .maybeSingle();
  if (!module) return fail("Module not found.");

  const prefix = `${module.course_id}/${module.id}/`;
  if (!input.storagePath.startsWith(prefix)) {
    return fail("Invalid storage path.");
  }

  const { data: last } = await supabase
    .from("course_module_files")
    .select("sort_order")
    .eq("module_id", module.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("course_module_files").insert({
    module_id: module.id,
    storage_path: input.storagePath,
    file_name: sanitizeModuleFileName(input.fileName),
    mime_type: input.mimeType,
    byte_size: input.byteSize,
    sort_order: Number(last?.sort_order ?? -1) + 1,
  });
  if (error) return fail(error.message);
  revalidateModules(module.id as string);
  return ok();
}

export async function deleteModuleFile(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!uuid.safeParse(id).success) return fail("Invalid file.");

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("course_module_files")
    .select("id, storage_path, module_id")
    .eq("id", id)
    .maybeSingle();
  if (!file) return fail("File not found.");

  const service = createServiceClient();
  await service.storage.from(MODULE_FILES_BUCKET).remove([file.storage_path as string]);

  const { error } = await supabase.from("course_module_files").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateModules(file.module_id as string);
  return ok();
}

const questionSchema = z.object({
  id: uuid.optional(),
  module_id: uuid,
  prompt: z.string().trim().min(2).max(500),
  explanation: z.string().trim().max(1000).optional().nullable(),
  options: z
    .array(z.string().trim().min(1).max(240))
    .min(2)
    .max(6),
  correctIndex: z.coerce.number().int().min(0),
});

export async function upsertModuleQuestion(formData: FormData) {
  await requireAdmin();
  const rawOptions = [0, 1, 2, 3, 4, 5]
    .map((index) => String(formData.get(`option_${index}`) ?? "").trim())
    .filter(Boolean);

  const parsed = questionSchema.safeParse({
    id: formData.get("id") || undefined,
    module_id: formData.get("module_id"),
    prompt: formData.get("prompt"),
    explanation: String(formData.get("explanation") ?? "").trim() || null,
    options: rawOptions,
    correctIndex: formData.get("correct_index"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid quiz question.");
  }
  if (parsed.data.correctIndex >= parsed.data.options.length) {
    return fail("Mark one option as the correct answer.");
  }

  const supabase = await createClient();
  let questionId = parsed.data.id;

  if (questionId) {
    const { error } = await supabase
      .from("course_module_quiz_questions")
      .update({
        prompt: parsed.data.prompt,
        explanation: parsed.data.explanation,
      })
      .eq("id", questionId)
      .eq("module_id", parsed.data.module_id);
    if (error) return fail(error.message);
    await supabase
      .from("course_module_quiz_options")
      .delete()
      .eq("question_id", questionId);
  } else {
    const { data: last } = await supabase
      .from("course_module_quiz_questions")
      .select("sort_order")
      .eq("module_id", parsed.data.module_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("course_module_quiz_questions")
      .insert({
        module_id: parsed.data.module_id,
        prompt: parsed.data.prompt,
        explanation: parsed.data.explanation,
        sort_order: Number(last?.sort_order ?? -1) + 1,
      })
      .select("id")
      .single();
    if (error || !data) return fail(error?.message ?? "Could not save question.");
    questionId = data.id as string;
  }

  const { error: optionError } = await supabase
    .from("course_module_quiz_options")
    .insert(
      parsed.data.options.map((label, index) => ({
        question_id: questionId,
        label,
        is_correct: index === parsed.data.correctIndex,
        sort_order: index,
      })),
    );
  if (optionError) return fail(optionError.message);
  revalidateModules(parsed.data.module_id);
  return ok();
}

export async function deleteModuleQuestion(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const moduleId = String(formData.get("module_id") ?? "");
  if (!uuid.safeParse(id).success) return fail("Invalid question.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_module_quiz_questions")
    .delete()
    .eq("id", id);
  if (error) return fail(error.message);
  if (uuid.safeParse(moduleId).success) revalidateModules(moduleId);
  else revalidateModules();
  return ok();
}
