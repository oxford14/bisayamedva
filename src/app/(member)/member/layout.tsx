import { MemberShell } from "@/components/member/member-shell";
import { getPracticeLabAccess } from "@/lib/member/practice-access-server";
import { requireStudent } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();
  const practiceAccess = await getPracticeLabAccess(profile);
  return (
    <MemberShell
      profile={profile}
      practiceLabAllowed={practiceAccess === "allowed"}
    >
      {children}
    </MemberShell>
  );
}
