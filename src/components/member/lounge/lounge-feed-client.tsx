"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  setLoungeReaction,
  type LoungeCommentMeta,
} from "@/app/(member)/member/lounge-actions";
import { LoungeComposer } from "@/components/member/lounge/lounge-composer";
import { LoungeNotifications } from "@/components/member/lounge/lounge-notifications";
import { LoungePostCard } from "@/components/member/lounge/lounge-post-card";
import { MemberEmptyState } from "@/components/member/ui";
import type {
  LoungeAuthor,
  LoungeComment,
  LoungeMentionCandidate,
  LoungeNotification,
  LoungePost,
  LoungeReaction,
} from "@/lib/member/lounge";
import { applyReactionToggle } from "@/lib/member/lounge-reactions";

function commentFromMeta(meta: LoungeCommentMeta, author: LoungeAuthor): LoungeComment {
  return {
    id: meta.id,
    post_id: meta.post_id,
    parent_id: meta.parent_id,
    body: meta.body,
    created_at: meta.created_at,
    updated_at: meta.created_at,
    pinned_at: null,
    author,
    replies: [],
  };
}

function appendCommentTree(
  roots: LoungeComment[],
  comment: LoungeComment,
  parentId: string | null,
): LoungeComment[] {
  if (!parentId) {
    return [...roots, comment];
  }
  return roots.map((root) => {
    if (root.id !== parentId) return root;
    return { ...root, replies: [...root.replies, comment] };
  });
}

export function LoungeFeedClient({
  posts: initialPosts,
  commentsByPost: initialCommentsByPost,
  notifications,
  unreadCount,
  viewerId,
  viewerAuthor,
  viewerCanModerate,
  viewerIsSuperAdmin,
  candidates,
  highlightPostId,
}: {
  posts: LoungePost[];
  commentsByPost: Record<string, LoungeComment[]>;
  notifications: LoungeNotification[];
  unreadCount: number;
  viewerId: string;
  viewerAuthor: LoungeAuthor;
  viewerCanModerate: boolean;
  viewerIsSuperAdmin: boolean;
  candidates: LoungeMentionCandidate[];
  highlightPostId?: string | null;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [commentsByPost, setCommentsByPost] = useState(initialCommentsByPost);
  const [pendingReactionByPost, setPendingReactionByPost] = useState<
    Record<string, LoungeReaction | undefined>
  >({});
  const [reactionErrorByPost, setReactionErrorByPost] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setPosts(initialPosts);
    setCommentsByPost(initialCommentsByPost);
  }, [initialPosts, initialCommentsByPost]);

  const handleReaction = useCallback(
    async (postId: string, reaction: LoungeReaction) => {
      let snapshot: LoungePost | undefined;
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          snapshot = p;
          return applyReactionToggle(p, reaction);
        }),
      );
      setPendingReactionByPost((prev) => ({ ...prev, [postId]: reaction }));
      setReactionErrorByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });

      const fd = new FormData();
      fd.set("post_id", postId);
      fd.set("reaction", reaction);
      if (snapshot) {
        fd.set("prev_reaction", snapshot.my_reaction ?? "");
        fd.set("reaction_counts", JSON.stringify(snapshot.reaction_counts));
      }

      const result = await setLoungeReaction(fd);
      setPendingReactionByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });

      if (!result.ok) {
        if (snapshot) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? snapshot! : p)),
          );
        }
        setReactionErrorByPost((prev) => ({
          ...prev,
          [postId]: result.message || "Could not save reaction. Try again.",
        }));
        return;
      }

      if (result.reaction_counts) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  reaction_counts: result.reaction_counts!,
                  my_reaction: result.my_reaction ?? null,
                }
              : p,
          ),
        );
      }
    },
    [],
  );

  const handleCommentPosted = useCallback(
    (meta: LoungeCommentMeta) => {
      const comment = commentFromMeta(meta, viewerAuthor);
      setCommentsByPost((prev) => ({
        ...prev,
        [meta.post_id]: appendCommentTree(
          prev[meta.post_id] ?? [],
          comment,
          meta.parent_id,
        ),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === meta.post_id
            ? { ...p, comment_count: p.comment_count + 1 }
            : p,
        ),
      );
      router.refresh();
    },
    [router, viewerAuthor],
  );

  const handlePostCreated = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <LoungeComposer candidates={candidates} onPosted={handlePostCreated} />
        {posts.length === 0 ? (
          <MemberEmptyState
            title="Quiet pa ang Lounge"
            body="Ikaw ang first — i-share imong question about Medical Billing, or celebrate a small win."
          />
        ) : (
          posts.map((post) => (
            <LoungePostCard
              key={post.id}
              post={post}
              comments={commentsByPost[post.id] ?? []}
              viewerId={viewerId}
              viewerCanModerate={viewerCanModerate}
              viewerIsSuperAdmin={viewerIsSuperAdmin}
              candidates={candidates}
              highlight={highlightPostId === post.id}
              pendingReaction={pendingReactionByPost[post.id]}
              reactionError={reactionErrorByPost[post.id]}
              onReaction={handleReaction}
              onCommentPosted={handleCommentPosted}
            />
          ))
        )}
      </div>
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <LoungeNotifications
          items={notifications}
          unreadCount={unreadCount}
        />
      </aside>
    </div>
  );
}
