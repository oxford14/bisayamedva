import { Users, Wallet, BookOpen } from "lucide-react";
import { ReferLinkCard } from "@/components/member/refer-link-card";
import { ReferralFriendsList } from "@/components/member/referral-friends-list";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { referCopy } from "@/content/site";
import { getReferralDashboard } from "@/lib/referrals/data";
import { getStudentProfile } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";

export default async function MemberReferPage() {
  const profile = await getStudentProfile();
  const dashboard = await getReferralDashboard(profile.id, profile.full_name);

  return (
    <div>
      <MemberPageHeader
        title={referCopy.title}
        description={referCopy.description}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Users className="size-4" aria-hidden />}
          label={referCopy.friends}
          value={String(dashboard.friendCount)}
        />
        <StatCard
          icon={<Wallet className="size-4" aria-hidden />}
          label={referCopy.earnings}
          value={formatPeso(dashboard.earnings)}
        />
        <StatCard
          icon={<BookOpen className="size-4" aria-hidden />}
          label={referCopy.enrolled}
          value={String(dashboard.enrolledCourses)}
        />
      </div>

      <div className="mt-6">
        <ReferLinkCard code={dashboard.code} link={dashboard.link} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">
          {referCopy.listTitle}
        </h2>
        {dashboard.rewards.length === 0 ? (
          <div className="mt-3">
            <MemberEmptyState
              title={referCopy.emptyTitle}
              body={referCopy.emptyBody}
            />
          </div>
        ) : (
          <ReferralFriendsList
            rewards={dashboard.rewards}
            friends={dashboard.friends}
          />
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <MemberCard>
      <div className="flex items-center gap-2 text-navy/60">
        {icon}
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
          {label}
        </p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
    </MemberCard>
  );
}