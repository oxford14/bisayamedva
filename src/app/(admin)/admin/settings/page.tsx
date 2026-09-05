import { requireSuperAdmin } from "@/lib/supabase/auth";
import { AdminPageHeader } from "@/components/admin/ui";
import { site } from "@/content/site";

export default async function SettingsPage() {
  await requireSuperAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Application identity for Bisaya MedVA."
      />

      <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            App URL
          </p>
          <p className="mt-1 text-sm">{process.env.NEXT_PUBLIC_APP_URL ?? site.url}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Support email
          </p>
          <p className="mt-1 text-sm">{site.email}</p>
        </div>
      </div>
    </div>
  );
}
