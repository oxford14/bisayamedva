import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { updatePaymentStatus } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { PaymentQr } from "@/components/payments/payment-qr";

function money(n: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(
      "id, amount, original_amount, currency, status, provider, provider_payment_id, created_at, promo_code_id, promo_codes(code), enrollments(profiles(full_name, email), courses(title))",
    )
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: payments } = await query;

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Generate a payment QR per record, download it as PNG, or share the pay link. Live PayMongo webhooks mark payments paid automatically; Super Admin can still adjust status manually when needed."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["", "PENDING", "PAID", "FAILED", "REFUNDED"].map((value) => (
          <a
            key={value || "all"}
            href={value ? `/admin/payments?status=${value}` : "/admin/payments"}
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-navy/70 hover:bg-sand"
          >
            {value || "All"}
          </a>
        ))}
      </div>

      {(payments ?? []).length === 0 ? (
        <EmptyState
          title="No payments"
          body="Payments are created automatically when an enrollment is added."
        />
      ) : (
        <AdminTable
          headers={[
            "Student",
            "Course",
            "Amount",
            "Provider",
            "Status",
            "Created",
            "QR",
            profile?.role === "SUPER_ADMIN" ? "Actions" : "",
          ].filter(Boolean)}
        >
          {(payments ?? []).map((row) => {
            const enrollment = Array.isArray(row.enrollments)
              ? row.enrollments[0]
              : row.enrollments;
            const student = enrollment
              ? Array.isArray(enrollment.profiles)
                ? enrollment.profiles[0]
                : enrollment.profiles
              : null;
            const course = enrollment
              ? Array.isArray(enrollment.courses)
                ? enrollment.courses[0]
                : enrollment.courses
              : null;
            const promo = Array.isArray(row.promo_codes)
              ? row.promo_codes[0]
              : row.promo_codes;
            const amountLabel = money(Number(row.amount), row.currency);
            const originalAmount =
              row.original_amount != null ? Number(row.original_amount) : null;
            return (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{student?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted">{student?.email}</div>
                </td>
                <td className="px-4 py-3">{course?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  <div>{amountLabel}</div>
                  {promo?.code ? (
                    <div className="mt-0.5 text-xs text-muted">
                      Promo:{" "}
                      <span className="font-medium text-navy">{promo.code}</span>
                      {originalAmount != null &&
                      originalAmount > Number(row.amount) ? (
                        <span>
                          {" "}
                          · was {money(originalAmount, row.currency)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>{row.provider}</div>
                  <div className="text-muted">{row.provider_payment_id ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <PaymentQr
                    variant="button"
                    paymentId={row.id}
                    amountLabel={amountLabel}
                    courseTitle={course?.title ?? undefined}
                  />
                </td>
                {profile?.role === "SUPER_ADMIN" ? (
                  <td className="px-4 py-3">
                    <ActionForm
                      action={updatePaymentStatus}
                      submitLabel="Set"
                      className="flex items-end gap-2"
                    >
                      <input type="hidden" name="id" value={row.id} />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-10 rounded-[10px] border border-border bg-white px-2 text-xs"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="FAILED">FAILED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </ActionForm>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
}
