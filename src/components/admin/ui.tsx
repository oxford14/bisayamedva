import { cn } from "@/lib/utils";

export function AdminPageHeader({
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

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/50 uppercase">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const tone =
    status === "PUBLISHED" ||
    status === "ACTIVE" ||
    status === "PAID" ||
    status === "COMPLETED"
      ? "bg-teal-bright/25 text-navy"
      : status === "DRAFT" || status === "PENDING" || status === "PENDING_PAYMENT"
        ? "bg-sand text-navy/80"
        : status === "FAILED" || status === "CANCELLED" || status === "ARCHIVED"
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

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-cream/60 px-6 py-12 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream/80 text-[11px] tracking-[0.12em] text-navy/55 uppercase">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
