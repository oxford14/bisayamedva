import { LoungeFeedClient } from "@/components/member/lounge/lounge-feed-client";
import type {
  LoungeAuthor,
  LoungeComment,
  LoungeMentionCandidate,
  LoungeNotification,
  LoungePost,
} from "@/lib/member/lounge";

export function LoungeFeed({
  posts,
  commentsByPost,
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
  return (
    <LoungeFeedClient
      posts={posts}
      commentsByPost={commentsByPost}
      notifications={notifications}
      unreadCount={unreadCount}
      viewerId={viewerId}
      viewerAuthor={viewerAuthor}
      viewerCanModerate={viewerCanModerate}
      viewerIsSuperAdmin={viewerIsSuperAdmin}
      candidates={candidates}
      highlightPostId={highlightPostId}
    />
  );
}
