import { LoungeComposer } from "@/components/member/lounge/lounge-composer";
import { LoungeNotifications } from "@/components/member/lounge/lounge-notifications";
import { LoungePostCard } from "@/components/member/lounge/lounge-post-card";
import { MemberEmptyState } from "@/components/member/ui";
import type {
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
  viewerCanModerate: boolean;
  viewerIsSuperAdmin: boolean;
  candidates: LoungeMentionCandidate[];
  highlightPostId?: string | null;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <LoungeComposer candidates={candidates} />
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
