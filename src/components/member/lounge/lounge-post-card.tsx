"use client";

import {
  EyeOff,
  Heart,
  Lightbulb,
  MessageCircle,
  MessageSquareOff,
  MoreHorizontal,
  PartyPopper,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createLoungeComment,
  deleteLoungeComment,
  deleteLoungePost,
  setLoungeReaction,
  toggleHideLoungePost,
  toggleLoungePostComments,
  togglePinLoungeComment,
  togglePinLoungePost,
  updateLoungePost,
  type LoungeActionState,
} from "@/app/(member)/member/lounge-actions";
import { MentionTextarea } from "@/components/member/lounge/mention-textarea";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import type {
  LoungeBadge,
  LoungeComment,
  LoungeMentionCandidate,
  LoungePost,
  LoungeReaction,
} from "@/lib/member/lounge";
import { LOUNGE_BADGE_LABELS } from "@/lib/member/lounge-badge";
import { cn } from "@/lib/utils";

const initial: LoungeActionState = { ok: false, message: "" };

function LoungeBadgeChip({ badge }: { badge: LoungeBadge | null }) {
  if (!badge) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal uppercase">
      {LOUNGE_BADGE_LABELS[badge]}
    </span>
  );
}

function Avatar({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="size-10 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-navy text-xs font-semibold text-cream">
      {initials || "?"}
    </span>
  );
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const reactionMeta: {
  key: LoungeReaction;
  label: string;
  Icon: typeof Heart;
}[] = [
  { key: "LIKE", label: "Like", Icon: Heart },
  { key: "CELEBRATE", label: "Celebrate", Icon: PartyPopper },
  { key: "HELPFUL", label: "Helpful", Icon: Lightbulb },
];

function CommentBranch({
  comment,
  postId,
  viewerId,
  viewerCanModerate,
  commentsLocked,
  candidates,
  depth,
}: {
  comment: LoungeComment;
  postId: string;
  viewerId: string;
  viewerCanModerate: boolean;
  commentsLocked: boolean;
  candidates: LoungeMentionCandidate[];
  depth: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [state, action, pending] = useActionState(createLoungeComment, initial);
  const [pendingDelete, startDelete] = useTransition();
  const [pendingPin, startPin] = useTransition();

  useEffect(() => {
    if (state.ok) setReplyOpen(false);
  }, [state]);

  const isPinned = Boolean(comment.pinned_at);

  return (
    <div className={cn(depth > 0 && "ml-10 border-l border-border/70 pl-3")}>
      <div className="flex gap-2.5">
        <Avatar name={comment.author.full_name} url={comment.author.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-cream/80 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold text-ink">
                {comment.author.full_name}
              </p>
              <LoungeBadgeChip badge={comment.author.lounge_badge} />
              {isPinned ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-navy/70 uppercase">
                  <Pin className="size-3" aria-hidden />
                  Pinned
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink/90">
              {comment.body}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 px-1 text-[11px] text-muted">
            <span>{formatWhen(comment.created_at)}</span>
            {depth === 0 && !commentsLocked ? (
              <button
                type="button"
                className="cursor-pointer font-semibold text-navy/70 hover:text-navy"
                onClick={() => setReplyOpen((v) => !v)}
              >
                Reply
              </button>
            ) : null}
            {viewerCanModerate && depth === 0 ? (
              <button
                type="button"
                className="cursor-pointer font-semibold text-navy/70 hover:text-navy"
                disabled={pendingPin}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("comment_id", comment.id);
                  fd.set("post_id", postId);
                  startPin(async () => {
                    await togglePinLoungeComment(fd);
                  });
                }}
              >
                {isPinned ? "Unpin" : "Pin"}
              </button>
            ) : null}
            {comment.author.id === viewerId ? (
              <button
                type="button"
                className="cursor-pointer font-semibold text-destructive/80 hover:text-destructive"
                disabled={pendingDelete}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("comment_id", comment.id);
                  fd.set("post_id", postId);
                  startDelete(async () => {
                    await deleteLoungeComment(fd);
                  });
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
          {replyOpen && !commentsLocked ? (
            <form action={action} className="mt-2 space-y-2">
              <input type="hidden" name="post_id" value={postId} />
              <input type="hidden" name="parent_id" value={comment.id} />
              <MentionTextarea
                id={`reply-${comment.id}`}
                name="body"
                rows={2}
                candidates={candidates}
                placeholder={`Reply to ${comment.author.full_name}…`}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="accent" disabled={pending}>
                  {pending ? "Sending…" : "Reply"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyOpen(false)}
                >
                  Cancel
                </Button>
              </div>
              {state.message && !state.ok ? (
                <p className="text-xs text-destructive">{state.message}</p>
              ) : null}
            </form>
          ) : null}
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentBranch
              key={reply.id}
              comment={reply}
              postId={postId}
              viewerId={viewerId}
              viewerCanModerate={viewerCanModerate}
              commentsLocked={commentsLocked}
              candidates={candidates}
              depth={1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LoungePostCard({
  post,
  comments,
  viewerId,
  viewerCanModerate,
  viewerIsSuperAdmin,
  candidates,
  highlight,
}: {
  post: LoungePost;
  comments: LoungeComment[];
  viewerId: string;
  viewerCanModerate: boolean;
  viewerIsSuperAdmin: boolean;
  candidates: LoungeMentionCandidate[];
  highlight?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showComments, setShowComments] = useState(
    Boolean(highlight) || comments.length > 0,
  );
  const [editState, editAction, editPending] = useActionState(
    updateLoungePost,
    initial,
  );
  const [commentState, commentAction, commentPending] = useActionState(
    createLoungeComment,
    initial,
  );
  const [reactPending, startReact] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [pinPending, startPin] = useTransition();
  const [hidePending, startHide] = useTransition();
  const [lockPending, startLock] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight) {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  useEffect(() => {
    if (editState.ok) setEditing(false);
  }, [editState]);

  useEffect(() => {
    if (commentState.ok) setShowComments(true);
  }, [commentState]);

  const isMine = post.author.id === viewerId;
  const isPinned = Boolean(post.pinned_at);
  const isHidden = Boolean(post.hidden_at);
  const commentsLocked = Boolean(post.comments_locked_at);
  const showMenu = isMine || viewerCanModerate || viewerIsSuperAdmin;
  const showDelete = isMine || (viewerIsSuperAdmin && !isMine);

  return (
    <div id={`post-${post.id}`} ref={rootRef}>
      <MemberCard
        className={cn(
          highlight && "ring-2 ring-teal-bright/50",
          isHidden && "border-dashed border-navy/25 bg-sand/50",
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar name={post.author.full_name} url={post.author.avatar_url} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-semibold text-ink">{post.author.full_name}</p>
                  <LoungeBadgeChip badge={post.author.lounge_badge} />
                </div>
                <p className="text-[11px] text-muted">
                  {isPinned ? (
                    <span className="mr-1.5 inline-flex items-center gap-1 font-semibold text-navy/70">
                      <Pin className="size-3" aria-hidden />
                      Pinned
                    </span>
                  ) : null}
                  {isHidden ? (
                    <span className="mr-1.5 inline-flex items-center gap-1 font-semibold text-navy/70">
                      <EyeOff className="size-3" aria-hidden />
                      Hidden
                    </span>
                  ) : null}
                  {commentsLocked ? (
                    <span className="mr-1.5 inline-flex items-center gap-1 font-semibold text-navy/70">
                      <MessageSquareOff className="size-3" aria-hidden />
                      Comments off
                    </span>
                  ) : null}
                  {formatWhen(post.created_at)}
                  {post.updated_at !== post.created_at ? " · edited" : ""}
                </p>
              </div>
              {showMenu ? (
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-navy/60 hover:bg-sand hover:text-navy"
                    aria-label="Post options"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                  {menuOpen ? (
                    <div className="absolute top-10 right-0 z-10 w-56 rounded-xl border border-border bg-white py-1 shadow-lg">
                      {viewerCanModerate ? (
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand"
                          disabled={pinPending}
                          onClick={() => {
                            setMenuOpen(false);
                            const fd = new FormData();
                            fd.set("post_id", post.id);
                            startPin(async () => {
                              await togglePinLoungePost(fd);
                            });
                          }}
                        >
                          <Pin className="size-3.5" />
                          {isPinned ? "Unpin" : "Pin"}
                        </button>
                      ) : null}
                      {viewerIsSuperAdmin ? (
                        <>
                          <button
                            type="button"
                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand"
                            disabled={hidePending}
                            onClick={() => {
                              setMenuOpen(false);
                              const fd = new FormData();
                              fd.set("post_id", post.id);
                              startHide(async () => {
                                await toggleHideLoungePost(fd);
                              });
                            }}
                          >
                            <EyeOff className="size-3.5" />
                            {isHidden ? "Unhide" : "Hide"}
                          </button>
                          <button
                            type="button"
                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand"
                            disabled={lockPending}
                            onClick={() => {
                              setMenuOpen(false);
                              const fd = new FormData();
                              fd.set("post_id", post.id);
                              startLock(async () => {
                                await toggleLoungePostComments(fd);
                              });
                            }}
                          >
                            <MessageSquareOff className="size-3.5" />
                            {commentsLocked
                              ? "Turn on comments"
                              : "Turn off comments"}
                          </button>
                        </>
                      ) : null}
                      {isMine ? (
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand"
                          onClick={() => {
                            setEditing(true);
                            setMenuOpen(false);
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </button>
                      ) : null}
                      {showDelete ? (
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-sand"
                          disabled={deletePending}
                          onClick={() => {
                            setMenuOpen(false);
                            if (
                              viewerIsSuperAdmin &&
                              !isMine &&
                              !window.confirm(
                                "Delete this post? Dili na ni makita sa Lounge.",
                              )
                            ) {
                              return;
                            }
                            const fd = new FormData();
                            fd.set("post_id", post.id);
                            startDelete(async () => {
                              await deleteLoungePost(fd);
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {editing ? (
              <form action={editAction} className="mt-3 space-y-2">
                <input type="hidden" name="post_id" value={post.id} />
                <MentionTextarea
                  id={`edit-${post.id}`}
                  name="body"
                  defaultValue={post.body}
                  candidates={candidates}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    variant="accent"
                    disabled={editPending}
                  >
                    {editPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
                {editState.message && !editState.ok ? (
                  <p className="text-xs text-destructive">{editState.message}</p>
                ) : null}
              </form>
            ) : (
              <>
                {post.body ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {post.body}
                  </p>
                ) : null}
                {post.image_url ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image_url}
                      alt=""
                      className="max-h-[28rem] w-full object-cover"
                    />
                  </div>
                ) : null}
              </>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {reactionMeta.map(({ key, label, Icon }) => {
                const count = post.reaction_counts[key] ?? 0;
                const active = post.my_reaction === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={reactPending}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-navy bg-navy text-cream"
                        : "border-border bg-cream/70 text-navy/80 hover:border-navy/30 hover:bg-white",
                    )}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("post_id", post.id);
                      fd.set("reaction", key);
                      startReact(async () => {
                        await setLoungeReaction(fd);
                      });
                    }}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                    {count > 0 ? <span>{count}</span> : null}
                  </button>
                );
              })}
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-cream/70 px-3 py-1.5 text-xs font-semibold text-navy/80 hover:bg-white"
                onClick={() => setShowComments((v) => !v)}
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Comments
                {post.comment_count > 0 ? <span>{post.comment_count}</span> : null}
              </button>
            </div>

            {showComments ? (
              <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
                {comments.map((comment) => (
                  <CommentBranch
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    viewerId={viewerId}
                    viewerCanModerate={viewerCanModerate}
                    commentsLocked={commentsLocked}
                    candidates={candidates}
                    depth={0}
                  />
                ))}
                {commentsLocked ? (
                  <p className="rounded-xl bg-sand/70 px-3 py-2 text-xs text-muted">
                    Comments are off for this post.
                  </p>
                ) : (
                  <form action={commentAction} className="space-y-2">
                    <input type="hidden" name="post_id" value={post.id} />
                    <MentionTextarea
                      id={`comment-${post.id}`}
                      name="body"
                      rows={2}
                      candidates={candidates}
                      placeholder="Write a comment… Use @Name to mention."
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="accent"
                      disabled={commentPending}
                    >
                      {commentPending ? "Posting…" : "Comment"}
                    </Button>
                    {commentState.message && !commentState.ok ? (
                      <p className="text-xs text-destructive">{commentState.message}</p>
                    ) : null}
                  </form>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </MemberCard>
    </div>
  );
}
