"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { List } from "lucide-react";
import {
  togglePromoActive,
  upsertPromoCode,
} from "@/app/(admin)/admin/actions";
import { StatusBadge } from "@/components/admin/ui";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPeso } from "@/lib/utils";

export type PromoManagerRow = {
  id: string;
  code: string;
  discount_type: "FIXED" | "PERCENT";
  discount_value: number;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  ends_at: string | null;
  note: string | null;
};

export type PromoRedemptionRow = {
  id: string;
  fullName: string;
  email: string;
  courseTitle: string;
  status: string;
  createdAt: string;
};

type FormState = {
  id: string;
  code: string;
  discount_type: "FIXED" | "PERCENT";
  discount_value: string;
  unlimited: boolean;
  max_redemptions: string;
  active: boolean;
  ends_at: string;
  note: string;
};

const emptyForm = (): FormState => ({
  id: "",
  code: "",
  discount_type: "FIXED",
  discount_value: "100",
  unlimited: true,
  max_redemptions: "50",
  active: true,
  ends_at: "",
  note: "",
});

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rowToForm(row: PromoManagerRow): FormState {
  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: String(row.discount_value),
    unlimited: row.max_redemptions == null,
    max_redemptions: row.max_redemptions != null ? String(row.max_redemptions) : "50",
    active: row.active,
    ends_at: toLocalInput(row.ends_at),
    note: row.note ?? "",
  };
}

function discountLabel(row: PromoManagerRow) {
  if (row.discount_type === "PERCENT") {
    return `${row.discount_value}% off`;
  }
  return `${formatPeso(row.discount_value)} off`;
}

export function PromoManager({
  promos,
  redemptions,
}: {
  promos: PromoManagerRow[];
  redemptions: Record<string, PromoRedemptionRow[]>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(promos);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();
  const [redemptionPromo, setRedemptionPromo] = useState<PromoManagerRow | null>(
    null,
  );
  const editing = Boolean(form.id);

  useEffect(() => {
    setRows(promos);
  }, [promos]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.code.localeCompare(b.code)),
    [rows],
  );

  function reset() {
    setForm(emptyForm());
    setError("");
    setSuccess("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await upsertPromoCode({
          id: form.id || undefined,
          code: form.code,
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          unlimited: form.unlimited,
          max_redemptions: form.unlimited ? undefined : form.max_redemptions,
          active: form.active,
          ends_at: form.ends_at || undefined,
          note: form.note || undefined,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRows((current) => {
          const next = result.promo;
          const exists = current.some((item) => item.id === next.id);
          return exists
            ? current.map((item) => (item.id === next.id ? next : item))
            : [next, ...current];
        });
        if (!editing) {
          setForm(emptyForm());
        }
        setSuccess(editing ? "Promo updated." : "Promo created.");
        router.refresh();
      } catch {
        setError("Could not save promo. Try again.");
      }
    });
  }

  function setActive(row: PromoManagerRow, active: boolean) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        const result = await togglePromoActive(row.id, active);
        if (!result?.ok) {
          setError(result?.error ?? "Could not update promo. Try again.");
          return;
        }
        setRows((current) =>
          current.map((item) =>
            item.id === row.id ? { ...item, active } : item,
          ),
        );
        if (form.id === row.id) {
          setForm((prev) => ({ ...prev, active }));
        }
        setSuccess(
          active
            ? "Promo activated. New checkouts can use this code again."
            : "Promo deactivated. Existing redemptions stay. New checkouts cannot use this code.",
        );
        router.refresh();
      } catch {
        setError("Could not update promo. Try again.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">
              {editing ? "Edit promo code" : "Create promo code"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Fixed ₱ or percent off for registration checkout. Slots can be
              limited or unlimited.
            </p>
          </div>
          {editing ? (
            <Button type="button" variant="secondary" size="sm" onClick={reset}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Code" htmlFor="code">
            <Input
              id="code"
              required
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="BISAYA100"
            />
          </Field>
          <Field label="Discount type" htmlFor="discount_type">
            <select
              id="discount_type"
              className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              value={form.discount_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discount_type: e.target.value as "FIXED" | "PERCENT",
                }))
              }
            >
              <option value="FIXED">Fixed ₱ off</option>
              <option value="PERCENT">Percent off</option>
            </select>
          </Field>
          <Field
            label={form.discount_type === "PERCENT" ? "Percent" : "Amount (₱)"}
            htmlFor="discount_value"
          >
            <Input
              id="discount_value"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.discount_value}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discount_value: e.target.value }))
              }
            />
          </Field>
          <Field label="Ends at (optional)" htmlFor="ends_at">
            <Input
              id="ends_at"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ends_at: e.target.value }))
              }
            />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.unlimited}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, unlimited: e.target.checked }))
                }
              />
              Unlimited slots
            </label>
            {!form.unlimited ? (
              <div className="w-40">
                <Field label="Max slots" htmlFor="max_redemptions">
                  <Input
                    id="max_redemptions"
                    type="number"
                    min="1"
                    required
                    value={form.max_redemptions}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        max_redemptions: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            ) : null}
            <label className="inline-flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
              Active
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="Note (optional)" htmlFor="note">
              <Input
                id="note"
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </Field>
          </div>

          {error ? (
            <p className="sm:col-span-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="sm:col-span-2 text-sm text-navy" role="status">
              {success}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" variant="accent" disabled={pending}>
              {pending
                ? "Saving…"
                : editing
                  ? "Update promo"
                  : "Create promo"}
            </Button>
          </div>
        </form>
      </div>

      {error || success ? (
        <p
          className={`text-sm ${error ? "text-destructive" : "text-navy"}`}
          role={error ? "alert" : "status"}
        >
          {error || success}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-cream/60 px-6 py-12 text-center">
          <p className="font-semibold text-ink">No promo codes yet</p>
          <p className="mt-2 text-sm text-muted">
            Create a code for registration checkout discounts.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cream/80 text-[11px] tracking-[0.12em] text-navy/55 uppercase">
                <tr>
                  {["Code", "Discount", "Slots", "Status", "Ends", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 font-semibold whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {sorted.map((row) => (
                  <tr
                    key={row.id}
                    className={form.id === row.id ? "bg-teal-bright/10" : undefined}
                  >
                    <td className="px-4 py-3 font-medium">{row.code}</td>
                    <td className="px-4 py-3">{discountLabel(row)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>
                          {row.redeemed_count}/
                          {row.max_redemptions == null
                            ? "∞"
                            : row.max_redemptions}
                        </span>
                        {row.redeemed_count > 0 ||
                        (redemptions[row.id]?.length ?? 0) > 0 ? (
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-navy/70 transition hover:bg-cream hover:text-navy"
                            aria-label={`View who used ${row.code}`}
                            onClick={() => setRedemptionPromo(row)}
                          >
                            <List className="size-4" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.active ? "ACTIVE" : "ARCHIVED"} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.ends_at
                        ? new Date(row.ends_at).toLocaleString("en-PH")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setForm(rowToForm(row));
                            setError("");
                            setSuccess("");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() => setActive(row, !row.active)}
                        >
                          {row.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {redemptionPromo ? (
        <PromoRedemptionsSheet
          promo={redemptionPromo}
          users={redemptions[redemptionPromo.id] ?? []}
          onClose={() => setRedemptionPromo(null)}
        />
      ) : null}
    </div>
  );
}

function PromoRedemptionsSheet({
  promo,
  users,
  onClose,
}: {
  promo: PromoManagerRow;
  users: PromoRedemptionRow[];
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-white shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            Who used this code
          </p>
          <h2
            id={titleId}
            className="mt-1 font-display text-xl font-semibold text-ink"
          >
            {promo.code}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {users.length} {users.length === 1 ? "person" : "people"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No one has used this code yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-start justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {user.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {user.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {user.courseTitle} ·{" "}
                      {new Date(user.createdAt).toLocaleString("en-PH")}
                    </p>
                  </div>
                  <StatusBadge status={user.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
