import { requireSuperAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  AdminPageHeader,
  AdminTable,
  StatusBadge,
} from "@/components/admin/ui";
import { site } from "@/content/site";

export default async function SettingsPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Super Admin controls for staff roles and application identity."
      />

      <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
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

      <h2 className="mb-3 font-semibold">Staff roles</h2>
      <AdminTable headers={["User", "Current role", "Change role"]}>
        {(users ?? []).map((user) => (
          <tr key={user.id}>
            <td className="px-4 py-3">
              <div className="font-medium">{user.full_name}</div>
              <div className="text-xs text-muted">{user.email}</div>
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={user.role} />
            </td>
            <td className="px-4 py-3">
              <ActionForm
                action={updateUserRole}
                submitLabel="Update"
                className="flex items-end gap-2"
              >
                <input type="hidden" name="user_id" value={user.id} />
                <select
                  name="role"
                  defaultValue={user.role}
                  className="h-10 rounded-[10px] border border-border bg-white px-2 text-xs"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </ActionForm>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
