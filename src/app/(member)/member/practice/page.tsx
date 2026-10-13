import { PracticeGate } from "@/components/member/practice/practice-gate";
import { PracticeHubClient } from "@/components/member/practice/practice-hub-client";
import { MemberPageHeader } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { getPracticeLabAccess } from "@/lib/member/practice-access-server";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPracticePage() {
  const profile = await getStudentProfile();
  const access = await getPracticeLabAccess(profile);

  if (access !== "allowed") {
    return (
      <div>
        <MemberPageHeader
          title={practiceCopy.hubTitle}
          description={practiceCopy.hubDescription}
        />
        <PracticeGate previewOnly={access === "staff-preview"} />
      </div>
    );
  }

  return (
    <div>
      <MemberPageHeader
        title={practiceCopy.hubTitle}
        description={practiceCopy.hubDescription}
      />
      <PracticeHubClient ownerUserId={profile.id} />
    </div>
  );
}
