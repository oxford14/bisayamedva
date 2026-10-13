import { PatientSchedulingWorkspace } from "@/components/member/practice/patient-scheduling-workspace";
import { PracticeGate } from "@/components/member/practice/practice-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { getPracticeLabAccess } from "@/lib/member/practice-access-server";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPracticeSchedulingPage() {
  const profile = await getStudentProfile();
  const access = await getPracticeLabAccess(profile);

  if (access !== "allowed") {
    return (
      <div>
        <MemberPageHeader
          title={practiceCopy.schedulingTitle}
          description={practiceCopy.schedulingDescription}
        />
        <PracticeGate previewOnly={access === "staff-preview"} />
      </div>
    );
  }

  return (
    <div>
      <MemberPageHeader
        title={practiceCopy.schedulingTitle}
        description={practiceCopy.schedulingDescription}
      />
      <PatientSchedulingWorkspace ownerUserId={profile.id} />
    </div>
  );
}
