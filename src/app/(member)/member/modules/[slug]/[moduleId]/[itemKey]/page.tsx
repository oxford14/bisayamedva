import Link from "next/link";
import { notFound } from "next/navigation";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { MemberEmptyState, MemberPageHeader } from "@/components/member/ui";
import { ModulePlayer } from "@/components/member/module-player";
import { getPlayerItemView, parseItemKey } from "@/lib/member/module-player";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string; moduleId: string; itemKey: string }>;
};

export default async function MemberModuleItemPage({ params }: Props) {
  const { slug, moduleId, itemKey } = await params;
  if (!parseItemKey(itemKey)) notFound();

  const profile = await getStudentProfile();
  const view = await getPlayerItemView(
    profile.id,
    slug,
    moduleId,
    itemKey,
    profile.role,
  );

  if (!view.course) {
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

  if (!view.flat.some((item) => item.moduleId === moduleId && item.key === itemKey)) {
    notFound();
  }

  return <ModulePlayer view={view} />;
}
