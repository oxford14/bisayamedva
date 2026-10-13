import { MockCallWorkspace } from "@/components/member/practice/mock-call-workspace";
import { PracticeGate } from "@/components/member/practice/practice-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { getPracticeLabAccess } from "@/lib/member/practice-access-server";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPracticeMockCallPage() {
  const profile = await getStudentProfile();
  const access = await getPracticeLabAccess(profile);

  if (access !== "allowed") {
    return (
      <div>
        <MemberPageHeader
          title={practiceCopy.mockCallTitle}
          description={practiceCopy.mockCallDescription}
        />
        <PracticeGate previewOnly={access === "staff-preview"} />
      </div>
    );
  }

  return (
    <div>
      <MemberPageHeader
        title={practiceCopy.mockCallTitle}
        description={practiceCopy.mockCallDescription}
      />
      <MockCallWorkspace ownerUserId={profile.id} userRole={profile.role} />
    </div>
  );
}
