import { LoungeBadgeForm } from "@/components/admin/lounge-badge-form";
import {
  EditUserForm,
  UserRoleActions,
} from "@/components/admin/user-forms";
import {
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";

export type UserDetailRecord = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  lounge_badge: string | null;
  mobile: string | null;
  occupation: string | null;
  experience_level: string | null;
  messenger_handle: string | null;
  created_at: string;
};

export type UserEnrollmentRecord = {
  id: string;
  status: string;
  created_at: string;
  courses: { title: string } | { title: string }[] | null;
  sessions: { title: string; starts_at: string | null } | { title: string; starts_at: string | null }[] | null;
};

export function UserDetailPanel({
  user,
  enrollments,
  actorId,
  isSuperAdmin,
}: {
  user: UserDetailRecord;
  enrollments: UserEnrollmentRecord[];
  actorId: string | null;
  isSuperAdmin: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Role
          </p>
          <div className="mt-1">
            <StatusBadge status={user.role} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Lounge badge
          </p>
          <div className="mt-1">
            {user.lounge_badge ? (
              <StatusBadge status={user.lounge_badge} />
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Joined
          </p>
          <p className="mt-1">
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <EditUserForm
        user={{
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          mobile: user.mobile,
          occupation: user.occupation,
          experience_level: user.experience_level,
          messenger_handle: user.messenger_handle,
        }}
      />

      <UserRoleActions
        userId={user.id}
        role={user.role}
        isSelf={actorId === user.id}
        isSuperAdmin={isSuperAdmin}
      />

      <LoungeBadgeForm
        userId={user.id}
        initialBadge={user.lounge_badge ?? null}
      />

      <div>
        <h2 className="mb-3 font-semibold">Enrollment history</h2>
        {enrollments.length === 0 ? (
          <EmptyState
            title="No enrollments"
            body="This user has not been enrolled in a session yet."
          />
        ) : (
          <AdminTable headers={["Course", "Session", "Status", "Created"]}>
            {enrollments.map((row) => {
              const course = Array.isArray(row.courses)
                ? row.courses[0]
                : row.courses;
              const session = Array.isArray(row.sessions)
                ? row.sessions[0]
                : row.sessions;
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">{course?.title ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div>{session?.title ?? "—"}</div>
                    <div className="text-xs text-muted">
                      {session?.starts_at
                        ? new Date(session.starts_at).toLocaleString()
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        )}
      </div>
    </div>
  );
}
