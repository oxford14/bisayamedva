"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAdminUser } from "@/app/(admin)/admin/actions";
import { canDeleteUser } from "@/lib/admin/user-permissions";

export function UserListActions({
  userId,
  userRole,
  actorId,
  actorRole,
  viewHref,
}: {
  userId: string;
  userRole: string;
  actorId: string | null;
  actorRole: string | null;
  viewHref: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const showDelete = canDeleteUser(actorRole, actorId, userRole, userId);

  function onDelete() {
    const confirmed = window.confirm(
      "Delete this user permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    setError("");
    const formData = new FormData();
    formData.set("user_id", userId);

    startTransition(async () => {
      try {
        const result = await deleteAdminUser(formData);
        if (!result?.ok) {
          setError(result?.error ?? "Could not delete user.");
          return;
        }
        router.refresh();
      } catch {
        setError("Could not delete user. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={viewHref}
          scroll={false}
          className="text-sm font-medium text-teal hover:text-navy"
        >
          View
        </Link>
        {showDelete ? (
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="text-sm font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="max-w-[12rem] text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
