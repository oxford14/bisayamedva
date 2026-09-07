import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { CreateUserForm } from "@/components/admin/user-forms";
import { UserListActions } from "@/components/admin/user-list-actions";
import { UserDetailOverlay } from "@/components/admin/user-detail-overlay";
import {
  UserDetailPanel,
  type UserEnrollmentRecord,
} from "@/components/admin/user-detail-panel";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";

function usersHref(q?: string) {
  return q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users";
}

function userViewHref(id: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("view", id);
  return `/admin/users?${params.toString()}`;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const { q, view } = await searchParams;
  const [profile, supabase] = await Promise.all([
    getCurrentProfile(),
    createClient(),
  ]);
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, lounge_badge, mobile, occupation, experience_level, referral_source, created_at",
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,mobile.ilike.%${q}%`,
    );
  }

  const { data: users } = await query;

  const viewedUserId = view?.trim() || null;
  const viewedUserPromise = viewedUserId
    ? supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, lounge_badge, mobile, occupation, experience_level, messenger_handle, created_at",
        )
        .eq("id", viewedUserId)
        .maybeSingle()
    : Promise.resolve({ data: null });
  const viewedEnrollmentsPromise = viewedUserId
    ? supabase
        .from("enrollments")
        .select(
          "id, status, created_at, notes, courses(title), sessions(title, starts_at)",
        )
        .eq("student_id", viewedUserId)
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [] });

  const [{ data: viewedUser }, { data: viewedEnrollments }] = await Promise.all([
    viewedUserPromise,
    viewedEnrollmentsPromise,
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Accounts, roles, and profile details — students and staff."
      />

      <div className="mb-5">
        <CreateUserForm canCreateSuperAdmin={profile?.role === "SUPER_ADMIN"} />
      </div>

      <form className="mb-5">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email, or mobile"
          className="h-11 w-full max-w-md rounded-[10px] border border-border bg-white px-3.5 text-sm"
        />
      </form>

      {(users ?? []).length === 0 ? (
        <EmptyState
          title="No users found"
          body="Create a user or wait for registration accounts to appear here."
        />
      ) : (
        <AdminTable
          headers={["Name", "Contact", "Role", "Experience", "Joined", ""]}
        >
          {(users ?? []).map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{user.full_name}</div>
                <div className="text-xs text-muted">{user.occupation ?? "—"}</div>
                {user.lounge_badge ? (
                  <div className="mt-1">
                    <StatusBadge status={user.lounge_badge} />
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <div>{user.email}</div>
                <div className="text-xs text-muted">{user.mobile ?? "—"}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={user.role} />
              </td>
              <td className="px-4 py-3 text-muted">
                {user.experience_level ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <UserListActions
                  userId={user.id}
                  userRole={user.role}
                  actorId={profile?.id ?? null}
                  actorRole={profile?.role ?? null}
                  viewHref={userViewHref(user.id, q)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {viewedUser ? (
        <UserDetailOverlay
          title={viewedUser.full_name}
          description={viewedUser.email}
          closeHref={usersHref(q)}
        >
          <UserDetailPanel
            user={{
              id: viewedUser.id,
              full_name: viewedUser.full_name,
              email: viewedUser.email,
              role: viewedUser.role,
              lounge_badge: viewedUser.lounge_badge,
              mobile: viewedUser.mobile,
              occupation: viewedUser.occupation,
              experience_level: viewedUser.experience_level,
              messenger_handle: viewedUser.messenger_handle,
              created_at: viewedUser.created_at,
            }}
            enrollments={(viewedEnrollments ?? []).map((row) => ({
              id: row.id,
              status: row.status,
              created_at: row.created_at,
              courses: row.courses,
              sessions: row.sessions,
            })) as UserEnrollmentRecord[]}
            actorId={profile?.id ?? null}
            isSuperAdmin={profile?.role === "SUPER_ADMIN"}
          />
        </UserDetailOverlay>
      ) : null}
    </div>
  );
}
