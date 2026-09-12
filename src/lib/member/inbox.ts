import { listPublishedAnnouncementsForUser } from "@/lib/member/announcements";
import { canAccessStudentLounge } from "@/lib/member/data";
import {
  getLoungeNotifications,
  getUnreadLoungeNotificationCount,
  type LoungeNotification,
} from "@/lib/member/lounge";
import type { MemberAnnouncementListItem } from "@/lib/member/announcements";

export type MemberInboxSnapshot = {
  notifications: LoungeNotification[];
  loungeUnread: number;
  announcements: MemberAnnouncementListItem[];
  announcementUnread: number;
  badgeTotal: number;
};

export async function getMemberInboxSnapshot(
  userId: string,
  role: string,
): Promise<MemberInboxSnapshot> {
  const loungeAllowed = await canAccessStudentLounge(userId, role);

  const [notifications, loungeUnread, announcements] = await Promise.all([
    loungeAllowed ? getLoungeNotifications(userId, 30) : Promise.resolve([]),
    loungeAllowed
      ? getUnreadLoungeNotificationCount(userId)
      : Promise.resolve(0),
    listPublishedAnnouncementsForUser(userId, 30),
  ]);

  const announcementUnread = announcements.filter((a) => !a.read).length;

  return {
    notifications,
    loungeUnread,
    announcements,
    announcementUnread,
    badgeTotal: loungeUnread + announcementUnread,
  };
}
