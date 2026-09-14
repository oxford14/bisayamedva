import { AdminWalletsList } from "@/components/admin/admin-wallets-list";
import {
  AdminPageHeader,
  EmptyState,
  MetricCard,
} from "@/components/admin/ui";
import { canCreditMemberWallets } from "@/lib/admin/wallet-permissions";
import { requireAdmin } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";
import { listAdminMemberWallets } from "@/lib/wallet/admin";

export default async function AdminWalletsPage() {
  const profile = await requireAdmin();
  const canCredit = canCreditMemberWallets(profile);
  const rows = await listAdminMemberWallets();

  const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);
  const withBalance = rows.filter((row) => row.balance > 0).length;

  return (
    <div>
      <AdminPageHeader
        title="Wallets"
        description="Student wallet balances. Credits go through the ledger as admin adjustments."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total balance"
          value={formatPeso(totalBalance)}
          hint="Sum of all student wallets shown here"
        />
        <MetricCard
          label="Students with balance"
          value={withBalance}
          hint={`${rows.length} student accounts listed`}
        />
      </div>

      {!canCredit ? (
        <p className="mb-4 rounded-xl border border-border bg-sand/60 px-4 py-3 text-sm text-navy/80">
          View only — wallet credits are limited to the primary super admin account.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No student wallets"
          body="When students register, their wallet rows appear here once they top up or receive a credit."
        />
      ) : (
        <AdminWalletsList rows={rows} canCredit={canCredit} />
      )}
    </div>
  );
}
