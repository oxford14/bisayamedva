"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTable } from "@/components/admin/ui";
import {
  WalletCreditSheet,
  WalletCreditTrigger,
} from "@/components/admin/wallet-credit-form";
import type { AdminMemberWalletRow } from "@/lib/wallet/admin";
import { formatPeso } from "@/lib/utils";

function formatUpdated(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH");
}

export function AdminWalletsList({
  rows,
  canCredit,
}: {
  rows: AdminMemberWalletRow[];
  canCredit: boolean;
}) {
  const [selected, setSelected] = useState<AdminMemberWalletRow | null>(null);

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.student_id}
            className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(47,56,38,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{row.full_name ?? "—"}</p>
                <p className="truncate text-xs text-muted">{row.email ?? "—"}</p>
              </div>
              <p className="shrink-0 font-display text-lg font-semibold text-navy">
                {formatPeso(row.balance)}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted">
              Last updated: {formatUpdated(row.wallet_updated_at)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/students/${row.student_id}`}
                className="text-xs font-medium text-teal hover:text-navy"
              >
                View student
              </Link>
              {canCredit ? (
                <WalletCreditTrigger onClick={() => setSelected(row)} />
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block">
        <AdminTable
          headers={[
            "Student",
            "Balance",
            "Last updated",
            ...(canCredit ? (["Actions"] as const) : []),
          ]}
        >
          {rows.map((row) => (
            <tr key={row.student_id}>
              <td className="px-4 py-3">
                <div className="font-medium">{row.full_name ?? "—"}</div>
                <div className="text-xs text-muted">{row.email ?? "—"}</div>
                <Link
                  href={`/admin/students/${row.student_id}`}
                  className="mt-1 inline-block text-xs font-medium text-teal hover:text-navy"
                >
                  View student
                </Link>
              </td>
              <td className="px-4 py-3 font-medium">{formatPeso(row.balance)}</td>
              <td className="px-4 py-3 text-xs text-muted">
                {formatUpdated(row.wallet_updated_at)}
              </td>
              {canCredit ? (
                <td className="px-4 py-3">
                  <WalletCreditTrigger onClick={() => setSelected(row)} />
                </td>
              ) : null}
            </tr>
          ))}
        </AdminTable>
      </div>

      <WalletCreditSheet
        student={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
