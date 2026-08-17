import { MemberCard, MemberPageHeader } from "@/components/member/ui";
import { MemberPasswordForm } from "@/components/member/password-form";
import { MemberProfileForm } from "@/components/member/profile-form";
import { requireStudent } from "@/lib/supabase/auth";

export default async function MemberProfilePage() {
  const profile = await requireStudent();

  return (
    <div className="space-y-6">
      <MemberPageHeader
        title="Profile"
        description="Update imong photo, contact details, and account password. Role stays Student."
      />

      <MemberCard className="max-w-xl">
        <div className="mb-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Contact and career details
          </h2>
          <p className="mt-1 text-sm text-muted">
            Keep your info updated so we can reach you about sessions and payments.
          </p>
        </div>
        <MemberProfileForm
          key={`${profile.avatar_path ?? "none"}:${profile.avatar_url ?? "no-url"}`}
          profile={profile}
        />
      </MemberCard>

      <MemberCard className="max-w-xl">
        <div className="mb-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Account security
          </h2>
          <p className="mt-1 text-sm text-muted">
            Verify your current password before setting a new one.
          </p>
        </div>
        <MemberPasswordForm />
      </MemberCard>
    </div>
  );
}
