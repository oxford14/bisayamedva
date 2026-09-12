import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { AdminPageHeader } from "@/components/admin/ui";
import { listAllAnnouncementsAdmin } from "@/lib/member/announcements";

export default async function AnnouncementsAdminPage() {
  const announcements = await listAllAnnouncementsAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Post updates for students. Paragraph breaks and spacing in the editor match what students read in the app."
      />
      <AnnouncementManager announcements={announcements} />
    </div>
  );
}
