import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentQr } from "@/components/payments/payment-qr";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";

type PayPageProps = {
  params: Promise<{ id: string }>;
};

async function getPublicPayment(id: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, currency, status, created_at, enrollments(courses(title))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const enrollment = Array.isArray(data.enrollments)
    ? data.enrollments[0]
    : data.enrollments;
  const course = enrollment
    ? Array.isArray(enrollment.courses)
      ? enrollment.courses[0]
      : enrollment.courses
    : null;

  return {
    id: data.id,
    amount: Number(data.amount),
    currency: data.currency as string,
    status: data.status as string,
    courseTitle: course?.title ?? site.featuredCourse.name,
  };
}

export async function generateMetadata({
  params,
}: PayPageProps): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPublicPayment(id);
  if (!payment) {
    return { title: `Payment | ${site.name}` };
  }
  return {
    title: `Payment · ${formatPeso(payment.amount)} | ${site.name}`,
    description: `Bayad para sa ${payment.courseTitle}. Scan or open this page to continue.`,
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params }: PayPageProps) {
  const { id } = await params;
  const payment = await getPublicPayment(id);
  if (!payment) notFound();

  const amountLabel = formatPeso(payment.amount);
  const isPaid = payment.status === "PAID";

  return (
    <section className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-teal uppercase">
        Payment
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
        {isPaid ? "Nabayran na ni" : "I-scan or open this link para mabayad"}
      </h1>
      <p className="mt-3 text-muted">
        {isPaid
          ? `Salamat. Confirmed na ang ${amountLabel} payment para sa ${payment.courseTitle}.`
          : `Pending payment para sa ${payment.courseTitle}. Share or download the QR below. Live PayMongo checkout comes next — for now, this QR opens this payment page.`}
      </p>

      <dl className="mt-8 space-y-3 border-y border-border py-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Course</dt>
          <dd className="text-right font-medium text-ink">{payment.courseTitle}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Amount</dt>
          <dd className="text-right font-semibold text-ink">{amountLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd className="text-right font-medium text-ink">{payment.status}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Reference</dt>
          <dd className="text-right font-mono text-xs text-ink">
            {payment.id.slice(0, 8).toUpperCase()}
          </dd>
        </div>
      </dl>

      {!isPaid ? (
        <div className="mt-8">
          <PaymentQr
            paymentId={payment.id}
            amountLabel={amountLabel}
            courseTitle={payment.courseTitle}
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="accent">
          <Link href="/register/checkout">Go to checkout</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </section>
  );
}
