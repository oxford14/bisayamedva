"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import {
  listPublishedAnnouncementsForUser,
  markAnnouncementRead as markRead,
} from "@/lib/member/announcements";
import { getMemberInboxSnapshot } from "@/lib/member/inbox";
import { getStudentProfile } from "@/lib/supabase/auth";
import {
  markLoungeNotificationRead,
  markLoungeNotificationsRead as markLoungeRead,
} from "@/app/(member)/member/lounge-actions";

export async function fetchMemberInbox() {
  noStore();
  const profile = await getStudentProfile();
  const snapshot = await getMemberInboxSnapshot(profile.id, profile.role);
  return { ok: true as const, snapshot };
}

export async function markLoungeNotificationsReadInbox() {
  return markLoungeRead();
}

export async function markAnnouncementReadInbox(announcementId: string) {
  const profile = await getStudentProfile();
  const ok = await markRead(profile.id, announcementId);
  revalidatePath("/member");
  return { ok, message: ok ? "Marked as read." : "Could not mark as read." };
}

export async function markLoungeNotificationReadInbox(notificationId: string) {
  return markLoungeNotificationRead(notificationId);
}

export async function markAllAnnouncementsReadInbox() {
  const profile = await getStudentProfile();
  const items = await listPublishedAnnouncementsForUser(profile.id, 30);
  const unread = items.filter((item) => !item.read);

  for (const item of unread) {
    const ok = await markRead(profile.id, item.id);
    if (!ok) {
      return { ok: false as const, message: "Could not mark announcements as read." };
    }
  }

  revalidatePath("/member");
  return { ok: true as const, message: "Marked as read." };
}

export async function markMemberInboxSeenInbox() {
  const [loungeResult, announcementResult] = await Promise.all([
    markLoungeNotificationsReadInbox(),
    markAllAnnouncementsReadInbox(),
  ]);

  if (!loungeResult.ok) {
    return {
      ok: false as const,
      message: loungeResult.message || "Could not mark notifications as read.",
    };
  }
  if (!announcementResult.ok) {
    return {
      ok: false as const,
      message: announcementResult.message || "Could not mark announcements as read.",
    };
  }

  return { ok: true as const, message: "Marked as read." };
}
