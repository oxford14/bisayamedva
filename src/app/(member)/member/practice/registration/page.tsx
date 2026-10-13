import { PatientRegistrationWorkspace } from "@/components/member/practice/patient-registration-workspace";
import { PracticeGate } from "@/components/member/practice/practice-gate";
import { MemberPageHeader } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { getPracticeLabAccess } from "@/lib/member/practice-access-server";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPracticeRegistrationPage() {
  const profile = await getStudentProfile();
  const access = await getPracticeLabAccess(profile);

  if (access !== "allowed") {
    return (
      <div>
        <MemberPageHeader
          title={practiceCopy.registrationTitle}
          description={practiceCopy.registrationDescription}
        />
        <PracticeGate previewOnly={access === "staff-preview"} />
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
