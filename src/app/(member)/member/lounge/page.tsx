import { LoungeFeed } from "@/components/member/lounge/lounge-feed";
import { LoungeGate } from "@/components/member/lounge/lounge-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { canAccessStudentLounge } from "@/lib/member/data";
import {
  getLoungeComments,
  getLoungeFeed,
  getLoungeNotifications,
  getUnreadLoungeNotificationCount,
  listLoungeStudentsForMentions,
} from "@/lib/member/lounge";
import { requireStudent } from "@/lib/supabase/auth";

export default async function MemberLoungePage({
  searchParams,
}: {
  searchParams?: Promise<{ post?: string }>;
}) {
  const profile = await requireStudent();
  const allowed = await canAccessStudentLounge(profile.id);
  const params = searchParams ? await searchParams : {};
  const highlightPostId = params.post ?? null;

  if (!allowed) {
    return (
      <div>
        <MemberPageHeader
          title="Student Lounge"
          description="Community space for co-students — questions, wins, and support."
        />
        <LoungeGate />
      </div>
    );
  }

  const [posts, notifications, unreadCount, candidates] = await Promise.all([
    getLoungeFeed(profile.id),
    getLoungeNotifications(profile.id),
    getUnreadLoungeNotificationCount(profile.id),
    listLoungeStudentsForMentions(),
  ]);

  const commentEntries = await Promise.all(
    posts.map(async (post) => [post.id, await getLoungeComments(post.id)] as const),
  );
  const commentsByPost = Object.fromEntries(commentEntries);

  return (
    <div>
      <MemberPageHeader
        title="Student Lounge"
        description="I-share imong question or success story. Mag-comment, mag-react, and mag-mention sa co-students."
      />
      <LoungeFeed
        posts={posts}
        commentsByPost={commentsByPost}
        notifications={notifications}
        unreadCount={unreadCount}
        viewerId={profile.id}
        candidates={candidates.filter((c) => c.id !== profile.id)}
        highlightPostId={highlightPostId}
      />
    </div>
  );
}
