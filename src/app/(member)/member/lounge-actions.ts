"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canAccessStudentLounge } from "@/lib/member/data";
import {
  LOUNGE_IMAGE_BUCKET,
  LOUNGE_IMAGE_MAX_BYTES,
  LOUNGE_IMAGE_MIME,
  canModerateLounge,
  canSuperModerateLounge,
  listLoungeStudentsForMentions,
  loungeImageObjectPath,
  resolveMentionsFromBody,
  type LoungeNotificationType,
  type LoungeReaction,
} from "@/lib/member/lounge";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type LoungeActionState = {
  ok: boolean;
  message: string;
};

async function requireLoungeStudent() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      profile: null as null,
      error: {
        ok: false as const,
        message: "Please log in to continue.",
      },
    };
  }
  const allowed = await canAccessStudentLounge(profile.id, profile.role);
  if (!allowed) {
    return {
      profile: null as null,
      error: {
        ok: false as const,
        message:
          "Enroll sa usa ka session una para maka-join sa Student Lounge.",
      },
    };
  }
  return { profile: { id: profile.id, role: profile.role }, error: null };
}

function revalidateLounge(postId?: string | null) {
  revalidatePath("/member/lounge");
  if (postId) revalidatePath(`/member/lounge?post=${postId}`);
}

async function notify(opts: {
  userId: string;
  actorId: string;
  type: LoungeNotificationType;
  postId?: string | null;
  commentId?: string | null;
}) {
  if (opts.userId === opts.actorId) return;
  const supabase = await createClient();
  await supabase.from("lounge_notifications").insert({
    user_id: opts.userId,
    actor_id: opts.actorId,
    type: opts.type,
    post_id: opts.postId ?? null,
    comment_id: opts.commentId ?? null,
  });
}

async function syncMentions(opts: {
  actorId: string;
  body: string;
  postId?: string | null;
  commentId?: string | null;
}) {
  const candidates = await listLoungeStudentsForMentions();
  const mentioned = resolveMentionsFromBody(opts.body, candidates).filter(
    (p) => p.id !== opts.actorId,
  );
  if (!mentioned.length) return;

  const supabase = await createClient();
  await supabase.from("lounge_mentions").insert(
    mentioned.map((person) => ({
      mentioned_user_id: person.id,
      actor_id: opts.actorId,
      post_id: opts.postId ?? null,
      comment_id: opts.commentId ?? null,
    })),
  );

  for (const person of mentioned) {
    await notify({
      userId: person.id,
      actorId: opts.actorId,
      type: "MENTION",
      postId: opts.postId,
      commentId: opts.commentId,
    });
  }
}

function extFromMime(mime: string): "webp" | "jpg" | "png" | null {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return null;
}

async function uploadPostImage(
  userId: string,
  postId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  if (!LOUNGE_IMAGE_MIME.includes(file.type as (typeof LOUNGE_IMAGE_MIME)[number])) {
    return { error: "Use a WebP, JPEG, or PNG photo." };
  }
  if (file.size > LOUNGE_IMAGE_MAX_BYTES) {
    return { error: "Photo must be 2MB or smaller." };
  }
  const ext = extFromMime(file.type);
  if (!ext) return { error: "Unsupported image type." };

  const path = loungeImageObjectPath(userId, postId, ext);
  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(LOUNGE_IMAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) return { error: error.message };
  return { path };
}

const postBodySchema = z.string().max(4000);

export async function createLoungePost(
  _prev: LoungeActionState,
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const bodyRaw = String(formData.get("body") ?? "").trim();
  const parsedBody = postBodySchema.safeParse(bodyRaw);
  if (!parsedBody.success) {
    return { ok: false, message: "Post is too long." };
  }
  const body = parsedBody.data;
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;

  if (!body && !hasImage) {
    return {
      ok: false,
      message: "Write something or attach a photo before posting.",
    };
  }

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("lounge_posts")
    .insert({
      author_id: gate.profile.id,
      body,
    })
    .select("id")
    .single();

  if (error || !post) {
    return { ok: false, message: error?.message ?? "Could not create post." };
  }

  if (hasImage) {
    const uploaded = await uploadPostImage(
      gate.profile.id,
      post.id,
      image as File,
    );
    if ("error" in uploaded) {
      await supabase
        .from("lounge_posts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", post.id);
      return { ok: false, message: uploaded.error };
    }
    await supabase
      .from("lounge_posts")
      .update({ image_path: uploaded.path })
      .eq("id", post.id);
  }

  if (body) {
    await syncMentions({
      actorId: gate.profile.id,
      body,
      postId: post.id,
    });
  }

  revalidateLounge(post.id);
  return { ok: true, message: "Posted na sa Student Lounge." };
}

export async function updateLoungePost(
  _prev: LoungeActionState,
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  const parsedBody = postBodySchema.safeParse(
    String(formData.get("body") ?? "").trim(),
  );
  if (!postId) return { ok: false, message: "Missing post." };
  if (!parsedBody.success || !parsedBody.data) {
    return { ok: false, message: "Post cannot be empty." };
  }
  const body = parsedBody.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("lounge_posts")
    .select("id, image_path")
    .eq("id", postId)
    .eq("author_id", gate.profile.id)
    .maybeSingle();

  if (!existing) return { ok: false, message: "Post not found." };

  const { error } = await supabase
    .from("lounge_posts")
    .update({ body })
    .eq("id", postId)
    .eq("author_id", gate.profile.id);

  if (error) return { ok: false, message: error.message };

  await syncMentions({
    actorId: gate.profile.id,
    body,
    postId,
  });

  revalidateLounge(postId);
  return { ok: true, message: "Updated na ang post." };
}

export async function deleteLoungePost(formData: FormData): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { ok: false, message: "Missing post." };

  const deletedAt = new Date().toISOString();

  if (canSuperModerateLounge(gate.profile)) {
    const service = createServiceClient();
    const { data: post, error: fetchError } = await service
      .from("lounge_posts")
      .select("id")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) return { ok: false, message: fetchError.message };
    if (!post) return { ok: false, message: "Post not found." };

    const { error } = await service
      .from("lounge_posts")
      .update({ deleted_at: deletedAt })
      .eq("id", postId);

    if (error) return { ok: false, message: error.message };
    revalidateLounge();
    return { ok: true, message: "Removed na ang post." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lounge_posts")
    .update({ deleted_at: deletedAt })
    .eq("id", postId)
    .eq("author_id", gate.profile.id);

  if (error) return { ok: false, message: error.message };
  revalidateLounge();
  return { ok: true, message: "Removed na ang post." };
}

export async function setLoungeReaction(formData: FormData): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  const reaction = String(formData.get("reaction") ?? "") as LoungeReaction;
  if (!postId || !["LIKE", "CELEBRATE", "HELPFUL"].includes(reaction)) {
    return { ok: false, message: "Invalid reaction." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("lounge_reactions")
    .select("reaction")
    .eq("post_id", postId)
    .eq("user_id", gate.profile.id)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    await supabase
      .from("lounge_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", gate.profile.id);
  } else if (existing) {
    await supabase
      .from("lounge_reactions")
      .update({ reaction })
      .eq("post_id", postId)
      .eq("user_id", gate.profile.id);
  } else {
    await supabase.from("lounge_reactions").insert({
      post_id: postId,
      user_id: gate.profile.id,
      reaction,
    });
  }

  const { data: post } = await supabase
    .from("lounge_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (post && !existing) {
    await notify({
      userId: post.author_id,
      actorId: gate.profile.id,
      type: "REACTION",
      postId,
    });
  }

  revalidateLounge(postId);
  return { ok: true, message: "Reaction saved." };
}

export async function createLoungeComment(
  _prev: LoungeActionState,
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();
  const parentId = parentIdRaw || null;
  const bodyParsed = z
    .string()
    .min(1, "Write a comment.")
    .max(2000)
    .safeParse(String(formData.get("body") ?? "").trim());
  if (!bodyParsed.success) {
    return {
      ok: false,
      message: bodyParsed.error.issues[0]?.message ?? "Write a comment.",
    };
  }
  const body = bodyParsed.data;
  if (!postId) return { ok: false, message: "Missing post." };

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("lounge_posts")
    .select("id, author_id, hidden_at, comments_locked_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!post) return { ok: false, message: "Post not found." };
  if (post.comments_locked_at) {
    return { ok: false, message: "Comments are off for this post." };
  }
  if (post.hidden_at && !canSuperModerateLounge(gate.profile)) {
    return { ok: false, message: "Post not found." };
  }

  if (parentId) {
    const { data: parent } = await supabase
      .from("lounge_comments")
      .select("id, parent_id, author_id")
      .eq("id", parentId)
      .eq("post_id", postId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!parent || parent.parent_id) {
      return {
        ok: false,
        message: "Replies only go one level deep.",
      };
    }
  }

  const { data: comment, error } = await supabase
    .from("lounge_comments")
    .insert({
      post_id: postId,
      author_id: gate.profile.id,
      parent_id: parentId,
      body,
    })
    .select("id")
    .single();

  if (error || !comment) {
    return { ok: false, message: error?.message ?? "Could not comment." };
  }

  if (parentId) {
    const { data: parent } = await supabase
      .from("lounge_comments")
      .select("author_id")
      .eq("id", parentId)
      .maybeSingle();
    if (parent) {
      await notify({
        userId: parent.author_id,
        actorId: gate.profile.id,
        type: "REPLY",
        postId,
        commentId: comment.id,
      });
    }
  } else if (post) {
    await notify({
      userId: post.author_id,
      actorId: gate.profile.id,
      type: "COMMENT",
      postId,
      commentId: comment.id,
    });
  }

  await syncMentions({
    actorId: gate.profile.id,
    body,
    postId,
    commentId: comment.id,
  });

  revalidateLounge(postId);
  return { ok: true, message: "Comment posted." };
}

export async function deleteLoungeComment(
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const commentId = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  if (!commentId) return { ok: false, message: "Missing comment." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lounge_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", gate.profile.id);

  if (error) return { ok: false, message: error.message };
  revalidateLounge(postId || null);
  return { ok: true, message: "Comment removed." };
}

async function requireLoungeModerator() {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate;

  const profile = await getCurrentProfile();
  if (!profile || !canModerateLounge(profile)) {
    return {
      profile: null as null,
      error: {
        ok: false as const,
        message: "Only Coach or Admin can pin items in the Lounge.",
      },
    };
  }

  return { profile: gate.profile, error: null };
}

async function requireLoungeSuperAdmin() {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate;

  if (!canSuperModerateLounge(gate.profile)) {
    return {
      profile: null as null,
      error: {
        ok: false as const,
        message: "Only Super Admin can moderate this post.",
      },
    };
  }

  return { profile: gate.profile, error: null };
}

export async function toggleHideLoungePost(
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeSuperAdmin();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { ok: false, message: "Missing post." };

  const service = createServiceClient();
  const { data: post, error: fetchError } = await service
    .from("lounge_posts")
    .select("id, hidden_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!post) return { ok: false, message: "Post not found." };

  const nextHiddenAt = post.hidden_at ? null : new Date().toISOString();
  const { error } = await service
    .from("lounge_posts")
    .update({ hidden_at: nextHiddenAt })
    .eq("id", postId);

  if (error) return { ok: false, message: error.message };
  revalidateLounge(postId);
  return {
    ok: true,
    message: nextHiddenAt
      ? "Hidden na ang post sa Lounge."
      : "Visible na liwat ang post.",
  };
}

export async function toggleLoungePostComments(
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeSuperAdmin();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { ok: false, message: "Missing post." };

  const service = createServiceClient();
  const { data: post, error: fetchError } = await service
    .from("lounge_posts")
    .select("id, comments_locked_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!post) return { ok: false, message: "Post not found." };

  const nextLockedAt = post.comments_locked_at ? null : new Date().toISOString();
  const { error } = await service
    .from("lounge_posts")
    .update({ comments_locked_at: nextLockedAt })
    .eq("id", postId);

  if (error) return { ok: false, message: error.message };
  revalidateLounge(postId);
  return {
    ok: true,
    message: nextLockedAt
      ? "Comments are off for this post."
      : "Comments are on liwat.",
  };
}

export async function togglePinLoungePost(
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeModerator();
  if (gate.error || !gate.profile) return gate.error!;

  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return { ok: false, message: "Missing post." };

  const service = createServiceClient();
  const { data: post, error: fetchError } = await service
    .from("lounge_posts")
    .select("id, pinned_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!post) return { ok: false, message: "Post not found." };

  const nextPinnedAt = post.pinned_at ? null : new Date().toISOString();
  const { error } = await service
    .from("lounge_posts")
    .update({ pinned_at: nextPinnedAt })
    .eq("id", postId);

  if (error) return { ok: false, message: error.message };
  revalidateLounge(postId);
  return {
    ok: true,
    message: nextPinnedAt ? "Post pinned." : "Post unpinned.",
  };
}

export async function togglePinLoungeComment(
  formData: FormData,
): Promise<LoungeActionState> {
  const gate = await requireLoungeModerator();
  if (gate.error || !gate.profile) return gate.error!;

  const commentId = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  if (!commentId) return { ok: false, message: "Missing comment." };

  const service = createServiceClient();
  const { data: comment, error: fetchError } = await service
    .from("lounge_comments")
    .select("id, pinned_at, post_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!comment) return { ok: false, message: "Comment not found." };

  const nextPinnedAt = comment.pinned_at ? null : new Date().toISOString();
  const { error } = await service
    .from("lounge_comments")
    .update({ pinned_at: nextPinnedAt })
    .eq("id", commentId);

  if (error) return { ok: false, message: error.message };
  revalidateLounge(postId || comment.post_id);
  return {
    ok: true,
    message: nextPinnedAt ? "Comment pinned." : "Comment unpinned.",
  };
}

export async function markLoungeNotificationsRead(): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const supabase = await createClient();
  const { error } = await supabase
    .from("lounge_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", gate.profile.id)
    .is("read_at", null);

  if (error) return { ok: false, message: error.message };
  revalidateLounge();
  return { ok: true, message: "Marked as read." };
}

export async function markLoungeNotificationRead(
  notificationId: string,
): Promise<LoungeActionState> {
  const gate = await requireLoungeStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const supabase = await createClient();
  const { error } = await supabase
    .from("lounge_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", gate.profile.id)
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) return { ok: false, message: error.message };
  revalidateLounge();
  return { ok: true, message: "Marked as read." };
}
