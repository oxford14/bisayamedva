import { cn } from "@/lib/utils";

export function MemberPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function MemberCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(47,56,38,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MemberEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-cream/60 px-6 py-12 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MemberStatusBadge({ status }: { status: string }) {
  const tone =
    status === "PUBLISHED" ||
    status === "ACTIVE" ||
    status === "PAID" ||
    status === "COMPLETED"
      ? "bg-teal-bright/25 text-navy"
      : status === "DRAFT" ||
          status === "PENDING" ||
          status === "PENDING_PAYMENT"
        ? "bg-sand text-navy/80"
        : status === "FAILED" ||
            status === "CANCELLED" ||
            status === "ARCHIVED" ||
            status === "REFUNDED"
          ? "bg-destructive/10 text-destructive"
          : "bg-sand text-muted";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        tone,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
