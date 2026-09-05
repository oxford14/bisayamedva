import Link from "next/link";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
} from "@/components/member/ui";
import { WalletTopupPanel } from "@/components/member/wallet-topup-panel";
import { Button } from "@/components/ui/button";
import { getMemberPayments } from "@/lib/member/data";
import { getStudentProfile } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";
import {
  formatWalletAmount,
  getOrCreateWallet,
  getWalletTransactions,
  walletTxnLabel,
} from "@/lib/wallet/ledger";

export default async function MemberWalletPage() {
  const profile = await getStudentProfile();
  const [wallet, transactions, payments] = await Promise.all([
    getOrCreateWallet(profile.id),
    getWalletTransactions(profile.id),
    getMemberPayments(profile.id),
  ]);

  const balanceLabel = formatPeso(wallet.balance);

  return (
    <div>
      <MemberPageHeader
        title="Wallet"
        description="Top up with PayMongo QR Ph, then enroll sa courses gamit ang imong balance. Schedule refunds also land here."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/member/payments">Payment receipts</Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <MemberCard>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            Available balance
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-navy">
            {balanceLabel}
          </p>
          <p className="mt-2 text-sm text-muted">
            Enroll from Courses or Schedule — if kulang, we ask you to top up
            first.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="accent" asChild>
              <Link href="/member/course">Browse courses</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/member/schedule">Open schedule</Link>
            </Button>
          </div>
        </MemberCard>

        <WalletTopupPanel balanceLabel={balanceLabel} />

        <MemberCard className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-ink">Wallet activity</h3>
            <p className="mt-1 text-sm text-muted">
              Top-ups, enrollments, and schedule refund credits.
            </p>
          </div>
          {transactions.length === 0 ? (
            <div className="px-5 py-10">
              <MemberEmptyState
                title="No wallet activity yet"
                body="Top up above, or enroll after you add funds."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {transactions.map((txn) => (
                <li
                  key={txn.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {walletTxnLabel(txn)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(txn.created_at).toLocaleString("en-PH")}
                      {txn.note ? ` · ${txn.note}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        txn.direction === "credit" ? "text-navy" : "text-ink"
                      }`}
                    >
                      {formatWalletAmount(txn)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Bal {formatPeso(txn.balance_after)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </MemberCard>

        {payments.length > 0 ? (
          <p className="text-center text-sm text-muted">
            {payments.length} course payment receipt
            {payments.length === 1 ? "" : "s"} —{" "}
            <Link href="/member/payments" className="font-medium text-teal hover:text-navy">
              view receipts
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
