import { PatientSchedulingWorkspace } from "@/components/member/practice/patient-scheduling-workspace";
import { PracticeGate } from "@/components/member/practice/practice-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { canAccessPracticeLab } from "@/lib/member/practice-access";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPracticeSchedulingPage() {
  const profile = await getStudentProfile();
  const allowed = canAccessPracticeLab(profile.role);

  if (!allowed) {
    return (
      <div>
        <MemberPageHeader
          title={practiceCopy.schedulingTitle}
          description={practiceCopy.schedulingDescription}
        />
        <PracticeGate previewOnly />
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
