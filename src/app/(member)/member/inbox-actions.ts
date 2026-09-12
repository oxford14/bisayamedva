"use server";

import { revalidatePath } from "next/cache";
import { markAnnouncementRead as markRead } from "@/lib/member/announcements";
import { getMemberInboxSnapshot } from "@/lib/member/inbox";
import { getStudentProfile } from "@/lib/supabase/auth";
import { markLoungeNotificationsRead as markLoungeRead } from "@/app/(member)/member/lounge-actions";

export async function fetchMemberInbox() {
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
