import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { AdminPageHeader } from "@/components/admin/ui";
import { formatSession } from "@/lib/content/featured-offer";
import { listAllAnnouncementsAdmin } from "@/lib/member/announcements";
import { createClient } from "@/lib/supabase/server";

function sessionLabel(session: {
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  format: string;
  status: string;
  courses?: { title: string | null } | { title: string | null }[] | null;
}) {
  const course = Array.isArray(session.courses)
    ? session.courses[0]?.title
    : session.courses?.title;
  const formatted = formatSession({
    id: "",
    title: session.title,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    timezone: session.timezone || "Asia/Manila",
    format: session.format || "Online",
    capacity: 0,
  });
  const when = `${formatted.day} · ${formatted.dateLabel} · ${formatted.startTime}–${formatted.endTime}`;
  const coursePart = course ? `${course} · ` : "";
  return `${coursePart}${when}`;
}

export default async function AnnouncementsAdminPage() {
  const supabase = await createClient();
  const [{ data: sessions }, announcements] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, title, status, starts_at, ends_at, timezone, format, courses(title)",
      )
      .order("starts_at", { ascending: false })
      .limit(200),
    listAllAnnouncementsAdmin(),
  ]);

  const sessionOptions = (sessions ?? []).map((session) => ({
    id: session.id,
    label: sessionLabel(session),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Target active members, a weekend session, or specific students. Optional email uses the same paragraph formatting as the app."
      />
      <AnnouncementManager
        announcements={announcements}
        sessions={sessionOptions}
      />
    </div>
  );
}
