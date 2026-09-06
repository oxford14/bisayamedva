import { WithdrawalReviewForm } from "@/components/admin/withdrawal-review-form";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { formatPeso } from "@/lib/utils";
import {
  WITHDRAWAL_STATUSES,
  listAdminWithdrawals,
  type WithdrawalMethod,
} from "@/lib/wallet/withdraw";

const METHOD_LABEL: Record<WithdrawalMethod, string> = {
  GCASH: "GCash",
  MAYA: "Maya",
  BANK: "Bank",
};

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const withdrawals = await listAdminWithdrawals(status);

  return (
    <div>
      <AdminPageHeader
        title="Withdrawals"
        description="Review student cash-out requests. Approve after you send the payout. Reject returns the amount to their wallet."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["", ...WITHDRAWAL_STATUSES].map((value) => (
          <a
            key={value || "all"}
            href={value ? `/admin/withdrawals?status=${value}` : "/admin/withdrawals"}
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-navy/70 hover:bg-sand"
          >
            {value || "All"}
          </a>
        ))}
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState
          title="No withdrawal requests"
          body="Students can request a cash-out from their Wallet. Pending requests appear here for review."
        />
      ) : (
        <AdminTable
          headers={[
            "Student",
            "Amount",
            "Payout to",
            "Status",
            "Requested",
            "Actions",
          ]}
        >
          {withdrawals.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{row.student_name ?? "—"}</div>
                <div className="text-xs text-muted">{row.student_email}</div>
              </td>
              <td className="px-4 py-3 font-medium">{formatPeso(row.amount)}</td>
              <td className="px-4 py-3 text-xs">
                <div className="font-medium text-ink">
                  {METHOD_LABEL[row.method]}
                  {row.bank_name ? ` · ${row.bank_name}` : ""}
                </div>
                <div>{row.account_name}</div>
                <div className="text-muted">{row.account_number}</div>
                {row.review_note ? (
                  <div className="mt-1 text-muted">Note: {row.review_note}</div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(row.created_at).toLocaleString("en-PH")}
              </td>
              <td className="px-4 py-3">
                {row.status === "PENDING" ? (
                  <WithdrawalReviewForm id={row.id} />
                ) : (
                  <span className="text-xs text-muted">Reviewed</span>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
