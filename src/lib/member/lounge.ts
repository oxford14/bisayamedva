import type { SupabaseClient } from "@supabase/supabase-js";
import { AVATAR_BUCKET } from "@/lib/member/avatar";
import {
  isLoungeBadge,
  type LoungeBadge,
} from "@/lib/member/lounge-badge";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type { LoungeBadge } from "@/lib/member/lounge-badge";

export const LOUNGE_IMAGE_BUCKET = "lounge-images";
export const LOUNGE_IMAGE_MAX_BYTES = 2_097_152;
export const LOUNGE_IMAGE_MIME = [
  "image/webp",
  "image/jpeg",
  "image/png",
] as const;
export const LOUNGE_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type LoungeReaction = "LIKE" | "CELEBRATE" | "HELPFUL";
export type LoungeNotificationType =
  | "COMMENT"
  | "REPLY"
  | "REACTION"
  | "MENTION";

export type LoungeAuthor = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lounge_badge: LoungeBadge | null;
};

export type LoungePost = {
  id: string;
  body: string;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  pinned_at: string | null;
  hidden_at: string | null;
  comments_locked_at: string | null;
  author: LoungeAuthor;
  comment_count: number;
  reaction_counts: Record<LoungeReaction, number>;
  my_reaction: LoungeReaction | null;
};

export type LoungeComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  pinned_at: string | null;
  author: LoungeAuthor;
  replies: LoungeComment[];
};

export type LoungeNotification = {
  id: string;
  type: LoungeNotificationType;
  post_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: LoungeAuthor;
};

export type LoungeMentionCandidate = {
  id: string;
  full_name: string;
};

export function loungeImageObjectPath(
  userId: string,
  postId: string,
  ext: "webp" | "jpg" | "png",
) {
  return `${userId}/${postId}.${ext}`;
}

async function signStoragePath(
  service: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
) {
  if (!path) return null;
  const { data, error } = await service.storage
    .from(bucket)
    .createSignedUrl(path, LOUNGE_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function displayName(fullName: string | null | undefined) {
  const trimmed = fullName?.trim();
  return trimmed || "Member";
}

function normalizeLoungeBadge(
  value: string | null | undefined,
): LoungeBadge | null {
  return isLoungeBadge(value) ? value : null;
}

function missingAuthor(id: string): LoungeAuthor {
  return { id, full_name: "Member", avatar_url: null, lounge_badge: null };
}

export function canModerateLounge(profile: {
  role?: string | null;
  lounge_badge?: string | null;
}) {
  if (profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") return true;
  return isLoungeBadge(profile.lounge_badge);
}

export function canSuperModerateLounge(profile: {
  role?: string | null;
}) {
  return profile.role === "SUPER_ADMIN";
}

function sortPinnedFirst<T extends { pinned_at: string | null; created_at: string }>(
  items: T[],
) {
  return [...items].sort((a, b) => {
    const aPinned = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
    const bPinned = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

async function mapAuthors(
  service: SupabaseClient,
  rows: {
    id: string;
    full_name: string;
    avatar_path: string | null;
    lounge_badge: string | null;
  }[],
) {
  const authors = new Map<string, LoungeAuthor>();
  await Promise.all(
    rows.map(async (row) => {
      const avatar_url = await signStoragePath(
        service,
        AVATAR_BUCKET,
        row.avatar_path,
      );
      authors.set(row.id, {
        id: row.id,
        full_name: displayName(row.full_name),
        avatar_url,
        lounge_badge: normalizeLoungeBadge(row.lounge_badge),
      });
    }),
  );
  return authors;
}

const emptyReactions = (): Record<LoungeReaction, number> => ({
  LIKE: 0,
  CELEBRATE: 0,
  HELPFUL: 0,
});

export async function getLoungeFeed(viewerId: string, limit = 40) {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data: posts, error } = await supabase
    .from("lounge_posts")
    .select(
      "id, author_id, body, image_path, created_at, updated_at, pinned_at, hidden_at, comments_locked_at",
    )
    .is("deleted_at", null)
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getLoungeFeed", error.message);
    return [] as LoungePost[];
  }
  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [{ data: profiles }, { data: reactions }, { data: commentRows }] =
    await Promise.all([
      service
        .from("profiles")
        .select("id, full_name, avatar_path, lounge_badge")
        .in("id", authorIds),
      supabase
        .from("lounge_reactions")
        .select("post_id, user_id, reaction")
        .in("post_id", postIds),
      supabase
        .from("lounge_comments")
        .select("post_id")
        .in("post_id", postIds)
        .is("deleted_at", null),
    ]);

  const authors = await mapAuthors(
    service,
    (profiles ?? []) as {
      id: string;
      full_name: string;
      avatar_path: string | null;
      lounge_badge: string | null;
    }[],
  );

  const commentCount = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentCount.set(
      row.post_id,
      (commentCount.get(row.post_id) ?? 0) + 1,
    );
  }

  const reactionCounts = new Map<string, Record<LoungeReaction, number>>();
  const myReaction = new Map<string, LoungeReaction>();
  for (const row of reactions ?? []) {
    const counts = reactionCounts.get(row.post_id) ?? emptyReactions();
    const key = row.reaction as LoungeReaction;
    counts[key] = (counts[key] ?? 0) + 1;
    reactionCounts.set(row.post_id, counts);
    if (row.user_id === viewerId) {
      myReaction.set(row.post_id, key);
    }
  }

  const feed: LoungePost[] = await Promise.all(
    posts.map(async (post) => {
      const author = authors.get(post.author_id) ?? missingAuthor(post.author_id);
      const image_url = await signStoragePath(
        service,
        LOUNGE_IMAGE_BUCKET,
        post.image_path,
      );
      return {
        id: post.id,
        body: post.body ?? "",
        image_path: post.image_path,
        image_url,
        created_at: post.created_at,
        updated_at: post.updated_at,
        pinned_at: post.pinned_at ?? null,
        hidden_at: post.hidden_at ?? null,
        comments_locked_at: post.comments_locked_at ?? null,
        author,
        comment_count: commentCount.get(post.id) ?? 0,
        reaction_counts: reactionCounts.get(post.id) ?? emptyReactions(),
        my_reaction: myReaction.get(post.id) ?? null,
      };
    }),
  );

  return sortPinnedFirst(feed);
}

export async function getLoungeComments(postId: string) {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data, error } = await supabase
    .from("lounge_comments")
    .select(
      "id, post_id, parent_id, author_id, body, created_at, updated_at, pinned_at",
    )
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getLoungeComments", error.message);
    return [] as LoungeComment[];
  }
  if (!data?.length) return [];

  const authorIds = [...new Set(data.map((c) => c.author_id))];
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, avatar_path, lounge_badge")
    .in("id", authorIds);

  const authors = await mapAuthors(
    service,
    (profiles ?? []) as {
      id: string;
      full_name: string;
      avatar_path: string | null;
      lounge_badge: string | null;
    }[],
  );

  const mapped: LoungeComment[] = data.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pinned_at: row.pinned_at ?? null,
    author: authors.get(row.author_id) ?? missingAuthor(row.author_id),
    replies: [],
  }));

  const roots: LoungeComment[] = [];
  const byId = new Map(mapped.map((c) => [c.id, c]));
  for (const comment of mapped) {
    if (comment.parent_id) {
      const parent = byId.get(comment.parent_id);
      if (parent && !parent.parent_id) {
        parent.replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  }
  return sortPinnedFirst(roots);
}

export async function getLoungeCommentsForPosts(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, LoungeComment[]>;

  const supabase = await createClient();
  const service = createServiceClient();

  const { data, error } = await supabase
    .from("lounge_comments")
    .select(
      "id, post_id, parent_id, author_id, body, created_at, updated_at, pinned_at",
    )
    .in("post_id", postIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getLoungeCommentsForPosts", error.message);
    return {} as Record<string, LoungeComment[]>;
  }
  if (!data?.length) {
    return Object.fromEntries(postIds.map((id) => [id, [] as LoungeComment[]]));
  }

  const authorIds = [...new Set(data.map((c) => c.author_id))];
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, avatar_path, lounge_badge")
    .in("id", authorIds);

  const authors = await mapAuthors(
    service,
    (profiles ?? []) as {
      id: string;
      full_name: string;
      avatar_path: string | null;
      lounge_badge: string | null;
    }[],
  );

  const byPost = new Map<string, LoungeComment[]>();
  for (const postId of postIds) {
    byPost.set(postId, []);
  }

  const mapped: LoungeComment[] = data.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pinned_at: row.pinned_at ?? null,
    author: authors.get(row.author_id) ?? missingAuthor(row.author_id),
    replies: [],
  }));

  for (const postId of postIds) {
    const postComments = mapped.filter((c) => c.post_id === postId);
    const roots: LoungeComment[] = [];
    const byId = new Map(postComments.map((c) => [c.id, c]));
    for (const comment of postComments) {
      if (comment.parent_id) {
        const parent = byId.get(comment.parent_id);
        if (parent && !parent.parent_id) {
          parent.replies.push(comment);
        }
      } else {
        roots.push(comment);
      }
    }
    byPost.set(postId, sortPinnedFirst(roots));
  }

  return Object.fromEntries(byPost);
}

export async function getLoungeNotifications(userId: string, limit = 30) {
  const supabase = await createClient();
  const service = createServiceClient();

  const { data, error } = await supabase
    .from("lounge_notifications")
    .select("id, type, post_id, comment_id, read_at, created_at, actor_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getLoungeNotifications", error.message);
    return [] as LoungeNotification[];
  }
  if (!data?.length) return [];

  const actorIds = [...new Set(data.map((n) => n.actor_id))];
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, avatar_path, lounge_badge")
    .in("id", actorIds);

  const authors = await mapAuthors(
    service,
    (profiles ?? []) as {
      id: string;
      full_name: string;
      avatar_path: string | null;
      lounge_badge: string | null;
    }[],
  );

  return data.map(
    (row) =>
      ({
        id: row.id,
        type: row.type as LoungeNotificationType,
        post_id: row.post_id,
        comment_id: row.comment_id,
        read_at: row.read_at,
        created_at: row.created_at,
        actor: authors.get(row.actor_id) ?? missingAuthor(row.actor_id),
      }) satisfies LoungeNotification,
  );
}

export async function getUnreadLoungeNotificationCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("lounge_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("getUnreadLoungeNotificationCount", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function searchLoungeMentionCandidates(query: string) {
  const q = query.trim();
  if (q.length < 1) return [] as LoungeMentionCandidate[];

  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("id, full_name")
    .eq("role", "STUDENT")
    .ilike("full_name", `%${q}%`)
    .order("full_name")
    .limit(8);

  if (error) {
    console.error("searchLoungeMentionCandidates", error.message);
    return [];
  }
  return ((data ?? []) as LoungeMentionCandidate[]).map((row) => ({
    id: row.id,
    full_name: displayName(row.full_name),
  }));
}

export async function listLoungeStudentsForMentions() {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("id, full_name")
    .eq("role", "STUDENT")
    .order("full_name")
    .limit(200);

  if (error) {
    console.error("listLoungeStudentsForMentions", error.message);
    return [] as LoungeMentionCandidate[];
  }
  return ((data ?? []) as LoungeMentionCandidate[]).map((row) => ({
    id: row.id,
    full_name: displayName(row.full_name),
  }));
}

/** Match @Full Name tokens against known student names (longest first). */
export function resolveMentionsFromBody(
  body: string,
  candidates: LoungeMentionCandidate[],
) {
  const sorted = [...candidates].sort(
    (a, b) => b.full_name.length - a.full_name.length,
  );
  const found = new Map<string, LoungeMentionCandidate>();
  for (const person of sorted) {
    const needle = `@${person.full_name}`;
    if (body.includes(needle)) {
      found.set(person.id, person);
    }
  }
  return [...found.values()];
}
