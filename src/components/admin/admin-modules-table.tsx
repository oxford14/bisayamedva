"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { moveCourseModuleOrder } from "@/app/(admin)/admin/modules-actions";
import { AdminTable, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export type AdminModuleRow = {
  id: string;
  title: string;
  status: string;
  sortOrder: number;
  courseId: string;
  courseTitle: string;
  fileCount: number;
  questionCount: number;
};

type Props = {
  modules: AdminModuleRow[];
};

function coursePositionFlags(modules: AdminModuleRow[]) {
  const byCourse = new Map<string, AdminModuleRow[]>();
  for (const row of modules) {
    const list = byCourse.get(row.courseId) ?? [];
    list.push(row);
    byCourse.set(row.courseId, list);
  }

  const flags = new Map<string, { canMoveUp: boolean; canMoveDown: boolean }>();
  for (const rows of byCourse.values()) {
    rows.forEach((row, index) => {
      flags.set(row.id, {
        canMoveUp: index > 0,
        canMoveDown: index < rows.length - 1,
      });
    });
  }
  return flags;
}

export function AdminModulesTable({ modules }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const positionFlags = useMemo(() => coursePositionFlags(modules), [modules]);

  const move = (moduleId: string, direction: "up" | "down") => {
    setError("");
    setMovingId(moduleId);
    startTransition(async () => {
      const result = await moveCourseModuleOrder(moduleId, direction);
      setMovingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <AdminTable headers={["Module", "Course", "Status", "Files", "Quiz", ""]}>
        {modules.map((row) => {
          const flags = positionFlags.get(row.id) ?? {
            canMoveUp: false,
            canMoveDown: false,
          };
          const rowBusy = pending && movingId === row.id;
          return (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 py-1 pr-1",
                      rowBusy && "opacity-60",
                    )}
                  >
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center text-navy transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Move module up"
                      disabled={!flags.canMoveUp || pending}
                      onClick={() => move(row.id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center text-navy transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Move module down"
                      disabled={!flags.canMoveDown || pending}
                      onClick={() => move(row.id, "down")}
                    >
                      <ArrowDown
                        className="h-4 w-4"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </button>
                  </div>
                  <div>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted">Order {row.sortOrder + 1}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{row.courseTitle || "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3">{row.fileCount}</td>
              <td className="px-4 py-3">{row.questionCount}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/modules/${row.id}`}
                  className="text-sm font-semibold text-navy hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
