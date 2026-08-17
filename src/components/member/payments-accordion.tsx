"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MemberStatusBadge } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export type MemberPaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_payment_id: string | null;
  created_at: string;
  courseTitle: string;
  sessionTitle: string | null;
  enrollmentStatus: string;
  enrollmentId: string;
};

export function MemberPaymentsAccordion({
  payments,
  studentName,
  studentEmail,
}: {
  payments: MemberPaymentRow[];
  studentName: string;
  studentEmail: string;
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {payments.map((payment) => {
        const amountLabel = formatPeso(Number(payment.amount));
        const paidAt = new Date(payment.created_at);
        const receiptNo = `BMV-${payment.id.slice(0, 8).toUpperCase()}`;
        const ref =
          payment.provider_payment_id?.slice(0, 18) ??
          payment.id.slice(0, 12).toUpperCase();

        return (
          <AccordionItem key={payment.id} value={payment.id} className="px-5">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 pr-2">
                <div className="min-w-0 text-left">
                  <p className="font-medium text-ink">{amountLabel}</p>
                  <p className="text-sm font-normal text-muted">
                    {payment.courseTitle}
                  </p>
                  <p className="mt-1 text-xs font-normal text-muted">
                    {paidAt.toLocaleDateString("en-PH")}
                    {payment.provider ? ` · ${payment.provider}` : ""}
                  </p>
                </div>
                <MemberStatusBadge status={payment.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pr-0 text-ink">
              <div className="mb-4 rounded-2xl border border-border bg-cream/80 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/50 uppercase">
                      Payment receipt
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold text-ink">
                      {site.name}
                    </p>
                    <p className="text-xs text-muted">{site.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Receipt No.</p>
                    <p className="font-mono text-sm font-semibold text-ink">
                      {receiptNo}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Student
                    </dt>
                    <dd className="mt-1 font-medium">{studentName}</dd>
                    <dd className="text-xs text-muted">{studentEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <MemberStatusBadge status={payment.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Course
                    </dt>
                    <dd className="mt-1 font-medium">{payment.courseTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Session
                    </dt>
                    <dd className="mt-1 font-medium">
                      {payment.sessionTitle ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Amount
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-semibold text-navy">
                      {amountLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Date
                    </dt>
                    <dd className="mt-1 font-medium">
                      {paidAt.toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Provider
                    </dt>
                    <dd className="mt-1 font-medium">
                      {payment.provider ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Reference
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs font-medium">
                      {ref}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Enrollment
                    </dt>
                    <dd className="mt-1">
                      <MemberStatusBadge status={payment.enrollmentStatus} />
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 text-xs leading-relaxed text-muted">
                  This is your Bisaya MedVA payment record for Medical Billing
                  training. Keep this receipt for your records.
                </p>
              </div>

              {payment.status === "PENDING" ? (
                <Button variant="accent" size="sm" asChild>
                  <Link href={`/pay/${payment.id}`}>Open payment page</Link>
                </Button>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
