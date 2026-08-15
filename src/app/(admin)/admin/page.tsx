import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  MetricCard,
  StatusBadge,
} from "@/components/admin/ui";

function money(n: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: studentCount },
    { count: activeEnrollments },
    { data: paidPayments },
    { data: nextSession },
    { count: sessionEnrollments },
    { data: recentEnrollments },
    { data: recentPayments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "STUDENT"),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabase.from("payments").select("amount, currency").eq("status", "PAID"),
    supabase
      .from("sessions")
      .select("id, title, capacity, starts_at")
      .eq("status", "PUBLISHED")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .neq("status", "CANCELLED"),
    supabase
      .from("enrollments")
      .select(
        "id, status, created_at, profiles(full_name, email), courses(title), sessions(title)",
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("payments")
      .select("id, amount, currency, status, created_at, enrollments(profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const revenue = (paidPayments ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  const filled = nextSession
    ? (
        await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("session_id", nextSession.id)
          .neq("status", "CANCELLED")
      ).count ?? 0
    : 0;

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Live snapshot of students, enrollments, and upcoming training capacity."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Students" value={studentCount ?? 0} />
        <MetricCard label="Active enrollments" value={activeEnrollments ?? 0} />
        <MetricCard label="Paid revenue" value={money(revenue)} />
        <MetricCard
          label="Next session seats"
          value={
            nextSession
              ? `${filled}/${nextSession.capacity}`
              : "—"
          }
          hint={nextSession?.title ?? "No published upcoming session"}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Recent enrollments</h2>
            <Link href="/admin/enrollments" className="text-sm font-medium text-teal hover:text-navy">
              View all
            </Link>
          </div>
          {(recentEnrollments ?? []).length === 0 ? (
            <EmptyState
              title="No enrollments yet"
              body="New enrollments will show here once students are registered into sessions."
            />
          ) : (
            <AdminTable headers={["Student", "Course", "Status", "Created"]}>
              {(recentEnrollments ?? []).map((row) => {
                const profile = Array.isArray(row.profiles)
                  ? row.profiles[0]
                  : row.profiles;
                const course = Array.isArray(row.courses)
                  ? row.courses[0]
                  : row.courses;
                return (
                  <tr key={row.id} className="text-ink">
                    <td className="px-4 py-3">
                      <div className="font-medium">{profile?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted">{profile?.email}</div>
                    </td>
                    <td className="px-4 py-3">{course?.title ?? "—"}</td>
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
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Recent payments</h2>
            <Link href="/admin/payments" className="text-sm font-medium text-teal hover:text-navy">
              View all
            </Link>
          </div>
          {(recentPayments ?? []).length === 0 ? (
            <EmptyState
              title="No payments yet"
              body="Payment records will appear here once enrollments create pending charges."
            />
          ) : (
            <AdminTable headers={["Student", "Amount", "Status", "Created"]}>
              {(recentPayments ?? []).map((row) => {
                const enrollment = Array.isArray(row.enrollments)
                  ? row.enrollments[0]
                  : row.enrollments;
                const profile = enrollment
                  ? Array.isArray(enrollment.profiles)
                    ? enrollment.profiles[0]
                    : enrollment.profiles
                  : null;
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">
                      {profile?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {money(Number(row.amount), row.currency)}
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
        </section>
      </div>

      <p className="mt-6 text-xs text-muted">
        Total non-cancelled enrollments tracked: {sessionEnrollments ?? 0}
      </p>
    </div>
  );
}
