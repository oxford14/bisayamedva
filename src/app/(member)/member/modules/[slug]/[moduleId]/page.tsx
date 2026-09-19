import { redirect } from "next/navigation";
import Link from "next/link";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { MemberEmptyState, MemberPageHeader } from "@/components/member/ui";
import {
  firstUnlockedItem,
  getCoursePlayerState,
} from "@/lib/member/module-player";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string; moduleId: string }>;
};

export default async function MemberModuleRedirectPage({ params }: Props) {
  const { slug, moduleId } = await params;
  const profile = await getStudentProfile();
  const state = await getCoursePlayerState(
    profile.id,
    slug,
    profile.role,
    profile.email,
  );

  if (!state.course) {
    return (
      <div>
        <MemberPageHeader title={modulesCopy.title} />
        <MemberEmptyState
          title={modulesCopy.notEnrolledTitle}
          body={modulesCopy.notEnrolledBody}
          action={
            <Button asChild variant="secondary">
              <Link href="/member/modules">{modulesCopy.filterAll}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const item = firstUnlockedItem(state, moduleId);
  if (!item) {
    redirect(`/member/modules/${slug}`);
  }
  redirect(item.href);
}
