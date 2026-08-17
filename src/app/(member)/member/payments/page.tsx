import Link from "next/link";
import { PaymentQr } from "@/components/payments/payment-qr";
import { MemberPaymentsAccordion } from "@/components/member/payments-accordion";
import {
  MemberCard,
  MemberEmptyState,
  MemberPageHeader,
  MemberStatusBadge,
} from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { getMemberPayments } from "@/lib/member/data";
import { requireStudent } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";

export default async function MemberPaymentsPage() {
  const profile = await requireStudent();
  const payments = await getMemberPayments(profile.id);
  const pending = payments.find((p) => p.status === "PENDING");

  return (
    <div>
      <MemberPageHeader
        title="Payments"
        description="Imong payment history for Medical Billing training. Open a row to view the receipt."
      />

      {payments.length === 0 ? (
        <MemberEmptyState
          title="No payments yet"
          body="When you enroll, a pending payment will show here with a QR and pay link."
          action={
            <Button variant="accent" asChild>
              <Link href="/register">Register</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {pending ? (
            <MemberCard className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                  Pending payment
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {formatPeso(Number(pending.amount))}
                </h2>
                <p className="mt-2 text-sm text-muted">{pending.courseTitle}</p>
                <div className="mt-3">
                  <MemberStatusBadge status={pending.status} />
                </div>
                <Button variant="accent" className="mt-5" asChild>
                  <Link href={`/pay/${pending.id}`}>Open payment page</Link>
                </Button>
              </div>
              <PaymentQr
                paymentId={pending.id}
                amountLabel={formatPeso(Number(pending.amount))}
                courseTitle={pending.courseTitle}
              />
            </MemberCard>
          ) : null}

          <MemberCard className="overflow-hidden p-0">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold text-ink">All payments</h3>
              <p className="mt-1 text-sm text-muted">
                Click a payment to open the receipt.
              </p>
            </div>
            <MemberPaymentsAccordion
              payments={payments}
              studentName={profile.full_name}
              studentEmail={profile.email}
            />
          </MemberCard>
        </div>
      )}
    </div>
  );
}
