import { normalizeAnnouncementBody } from "@/lib/member/announcement-body";
import {
  countAnnouncementRecipients,
  listAnnouncementSessionIds,
  type AnnouncementAudienceType,
} from "@/lib/member/announcement-audience";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export { normalizeAnnouncementBody } from "@/lib/member/announcement-body";
export type { AnnouncementAudienceType };

export type MemberAnnouncement = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  audience_type: AnnouncementAudienceType;
  send_email: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  recipient_count?: number;
  session_count?: number;
};

export type MemberAnnouncementListItem = Pick<
  MemberAnnouncement,
  "id" | "title" | "body" | "created_at"
> & { read: boolean };

export async function listPublishedAnnouncementsForUser(
  userId: string,
  limit = 30,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_announcement_recipients")
    .select(
      "announcement_id, member_announcements!inner(id, title, body, created_at, published)",
    )
    .eq("user_id", userId)
    .eq("member_announcements.published", true)
    .limit(limit);

  if (error) {
    console.error("listPublishedAnnouncementsForUser", error.message);
    return [] as MemberAnnouncementListItem[];
  }
  if (!data?.length) return [];

  type Row = {
    announcement_id: string;
    member_announcements:
      | {
          id: string;
          title: string;
          body: string;
          created_at: string;
          published: boolean;
        }
      | {
          id: string;
          title: string;
          body: string;
          created_at: string;
          published: boolean;
        }[];
  };

  const announcements = data
    .map((row) => {
      const r = row as Row;
      const ann = Array.isArray(r.member_announcements)
        ? r.member_announcements[0]
        : r.member_announcements;
      return ann;
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const ids = announcements.map((a) => a.id);
  const { data: reads } = await supabase
    .from("member_announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId)
    .in("announcement_id", ids);

  const readSet = new Set((reads ?? []).map((r) => r.announcement_id));

  return announcements.map((row) => ({
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
  const readAt = new Date().toISOString();
  const row = {
    user_id: userId,
    announcement_id: announcementId,
    read_at: readAt,
  };

  const { error: insertError } = await supabase
    .from("member_announcement_reads")
    .insert(row);

  if (!insertError) return true;

  if (insertError.code !== "23505") {
    console.error("markAnnouncementRead", insertError.message);
    return false;
  }

  const { error: updateError } = await supabase
    .from("member_announcement_reads")
    .update({ read_at: readAt })
    .eq("user_id", userId)
    .eq("announcement_id", announcementId);

  if (updateError) {
    console.error("markAnnouncementRead", updateError.message);
    return false;
  }
  return true;
}

export async function listAllAnnouncementsAdmin() {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("member_announcements")
    .select(
      "id, title, body, published, audience_type, send_email, email_sent_at, created_at, updated_at, created_by",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAllAnnouncementsAdmin", error.message);
    return [] as MemberAnnouncement[];
  }

  const rows = (data ?? []) as MemberAnnouncement[];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const [recipient_count, sessionIds] = await Promise.all([
        countAnnouncementRecipients(row.id),
        row.audience_type === "SESSION"
          ? listAnnouncementSessionIds(row.id)
          : Promise.resolve([]),
      ]);
      return {
        ...row,
        recipient_count,
        session_count: sessionIds.length,
      };
    }),
  );
  return enriched;
}
