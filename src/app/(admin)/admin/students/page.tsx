import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, mobile, occupation, experience_level, referral_source, created_at",
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,mobile.ilike.%${q}%`,
    );
  }

  const { data: students } = await query;

  return (
    <div>
      <AdminPageHeader
        title="Students"
        description="Accounts and profile details from registration."
      />

      <form className="mb-5">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email, or mobile"
          className="h-11 w-full max-w-md rounded-[10px] border border-border bg-white px-3.5 text-sm"
        />
      </form>

      {(students ?? []).length === 0 ? (
        <EmptyState
          title="No students found"
          body="Student profiles will appear after registration or account creation."
        />
      ) : (
        <AdminTable
          headers={["Name", "Contact", "Role", "Experience", "Joined", ""]}
        >
          {(students ?? []).map((student) => (
            <tr key={student.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{student.full_name}</div>
                <div className="text-xs text-muted">{student.occupation ?? "—"}</div>
              </td>
              <td className="px-4 py-3">
                <div>{student.email}</div>
                <div className="text-xs text-muted">{student.mobile ?? "—"}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={student.role} />
              </td>
              <td className="px-4 py-3 text-muted">
                {student.experience_level ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(student.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/students/${student.id}`}
                  className="text-sm font-medium text-teal hover:text-navy"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
