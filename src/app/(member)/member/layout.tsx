import { requireStudent } from "@/lib/supabase/auth";
import { MemberShell } from "@/components/member/member-shell";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();
  return <MemberShell profile={profile}>{children}</MemberShell>;
}
