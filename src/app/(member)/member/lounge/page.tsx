import { LoungeFeed } from "@/components/member/lounge/lounge-feed";
import { LoungeGate } from "@/components/member/lounge/lounge-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { canAccessStudentLounge } from "@/lib/member/data";
import {
  canModerateLounge,
  canSuperModerateLounge,
  getLoungeCommentsForPosts,
  getLoungeFeed,
  getLoungeNotifications,
  getUnreadLoungeNotificationCount,
  listLoungeStudentsForMentions,
} from "@/lib/member/lounge";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberLoungePage({
  searchParams,
}: {
  searchParams?: Promise<{ post?: string }>;
}) {
  const profile = await getStudentProfile();
  const allowed = await canAccessStudentLounge(profile.id, profile.role);
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

  const commentsByPost = await getLoungeCommentsForPosts(posts.map((p) => p.id));

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
        viewerCanModerate={canModerateLounge(profile)}
        viewerIsSuperAdmin={canSuperModerateLounge(profile)}
        candidates={candidates.filter((c) => c.id !== profile.id)}
        highlightPostId={highlightPostId}
      />
    </div>
  );
}
