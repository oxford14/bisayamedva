import { createServiceClient } from "@/lib/supabase/admin";

export type AnnouncementAudienceType = "ALL" | "SESSION" | "INDIVIDUAL";

export type AnnouncementRecipient = {
  userId: string;
  email: string;
  fullName: string;
};

const ENROLLMENT_STATUSES = ["ACTIVE", "COMPLETED"] as const;

export async function resolveAnnouncementRecipients(input: {
  audienceType: AnnouncementAudienceType;
  sessionIds?: string[];
  userIds?: string[];
}): Promise<AnnouncementRecipient[]> {
  const admin = createServiceClient();

  if (input.audienceType === "INDIVIDUAL") {
    const ids = [...new Set((input.userIds ?? []).filter(Boolean))];
    if (!ids.length) return [];

    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .in("id", ids)
      .eq("role", "STUDENT");

    if (error) {
      console.error("resolveAnnouncementRecipients individual", error.message);
      return [];
    }

    return (profiles ?? [])
      .filter((p) => p.email?.trim())
      .map((p) => ({
        userId: p.id,
        email: p.email!.trim(),
        fullName: p.full_name?.trim() || p.email!.trim(),
      }));
  }

  let enrollQuery = admin
    .from("enrollments")
    .select("student_id")
    .in("status", [...ENROLLMENT_STATUSES]);

  if (input.audienceType === "SESSION") {
    const sessionIds = [...new Set((input.sessionIds ?? []).filter(Boolean))];
    if (!sessionIds.length) return [];
    enrollQuery = enrollQuery.in("session_id", sessionIds);
  }

  const { data: rows, error } = await enrollQuery;
  if (error) {
    console.error("resolveAnnouncementRecipients enrollments", error.message);
    return [];
  }

  const studentIds = [
    ...new Set((rows ?? []).map((r) => r.student_id).filter(Boolean)),
  ];
  if (!studentIds.length) return [];

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name, role")
    .in("id", studentIds)
    .eq("role", "STUDENT");

  if (profileError) {
    console.error("resolveAnnouncementRecipients profiles", profileError.message);
    return [];
  }

  return (profiles ?? [])
    .filter((p) => p.email?.trim())
    .map((p) => ({
      userId: p.id,
      email: p.email!.trim(),
      fullName: p.full_name?.trim() || p.email!.trim(),
    }));
}

export async function syncAnnouncementSessions(
  announcementId: string,
  sessionIds: string[],
) {
  const admin = createServiceClient();
  await admin
    .from("member_announcement_sessions")
    .delete()
    .eq("announcement_id", announcementId);

  const unique = [...new Set(sessionIds.filter(Boolean))];
  if (!unique.length) return;

  const { error } = await admin.from("member_announcement_sessions").insert(
    unique.map((session_id) => ({
      announcement_id: announcementId,
      session_id,
    })),
  );
  if (error) console.error("syncAnnouncementSessions", error.message);
}

export async function syncAnnouncementRecipients(
  announcementId: string,
  userIds: string[],
) {
  const admin = createServiceClient();
  await admin
    .from("member_announcement_recipients")
    .delete()
    .eq("announcement_id", announcementId);

  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;

  const chunkSize = 500;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { error } = await admin.from("member_announcement_recipients").insert(
      chunk.map((user_id) => ({
        announcement_id: announcementId,
        user_id,
      })),
    );
    if (error) {
      console.error("syncAnnouncementRecipients", error.message);
      throw new Error(error.message);
    }
  }
}

export async function countAnnouncementRecipients(announcementId: string) {
  const admin = createServiceClient();
  const { count, error } = await admin
    .from("member_announcement_recipients")
    .select("user_id", { count: "exact", head: true })
    .eq("announcement_id", announcementId);
  if (error) return 0;
  return count ?? 0;
}

export async function listAnnouncementSessionIds(announcementId: string) {
  const admin = createServiceClient();
  const { data } = await admin
    .from("member_announcement_sessions")
    .select("session_id")
    .eq("announcement_id", announcementId);
  return (data ?? []).map((r) => r.session_id);
}
