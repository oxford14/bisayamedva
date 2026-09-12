import { normalizeAnnouncementBody } from "@/lib/member/announcement-body";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export { normalizeAnnouncementBody } from "@/lib/member/announcement-body";

export type MemberAnnouncement = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type MemberAnnouncementListItem = Pick<
  MemberAnnouncement,
  "id" | "title" | "body" | "created_at"
> & { read: boolean };

export async function listPublishedAnnouncements(limit = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_announcements")
    .select("id, title, body, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listPublishedAnnouncements", error.message);
    return [] as MemberAnnouncementListItem[];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    read: false,
  }));
}

export async function listPublishedAnnouncementsForUser(
  userId: string,
  limit = 30,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_announcements")
    .select("id, title, body, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listPublishedAnnouncementsForUser", error.message);
    return [] as MemberAnnouncementListItem[];
  }
  if (!data?.length) return [];

  const ids = data.map((row) => row.id);
  const { data: reads } = await supabase
    .from("member_announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId)
    .in("announcement_id", ids);

  const readSet = new Set((reads ?? []).map((r) => r.announcement_id));

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    read: readSet.has(row.id),
  }));
}

export async function countUnreadAnnouncements(userId: string) {
  const items = await listPublishedAnnouncementsForUser(userId, 100);
  return items.filter((item) => !item.read).length;
}

export async function markAnnouncementRead(
  userId: string,
  announcementId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("member_announcement_reads").upsert(
    {
      user_id: userId,
      announcement_id: announcementId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,announcement_id" },
  );

  if (error) {
    console.error("markAnnouncementRead", error.message);
    return false;
  }
  return true;
}

export async function listAllAnnouncementsAdmin() {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("member_announcements")
    .select(
      "id, title, body, published, created_at, updated_at, created_by",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAllAnnouncementsAdmin", error.message);
    return [] as MemberAnnouncement[];
  }
  return (data ?? []) as MemberAnnouncement[];
}
