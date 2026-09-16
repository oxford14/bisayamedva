import { PatientRegistrationWorkspace } from "@/components/member/practice/patient-registration-workspace";
import { PracticeGate } from "@/components/member/practice/practice-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { canAccessPracticeLab } from "@/lib/member/practice-access";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPracticeRegistrationPage() {
  const profile = await getStudentProfile();
  const allowed = canAccessPracticeLab(profile.role);

  if (!allowed) {
    return (
      <div>
        <MemberPageHeader
          title={practiceCopy.registrationTitle}
          description={practiceCopy.registrationDescription}
        />
        <PracticeGate previewOnly />
      </div>
    );
  }

  return (
    <div>
      <MemberPageHeader
        title={practiceCopy.registrationTitle}
        description={practiceCopy.registrationDescription}
      />
      <PatientRegistrationWorkspace ownerUserId={profile.id} />
    </div>
  );
}
