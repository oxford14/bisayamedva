"use client";

import { useState, useTransition } from "react";
import { deleteCourseModule } from "@/app/(admin)/admin/modules-actions";
import { Button } from "@/components/ui/button";

export function ModuleDeleteForm({ moduleId }: { moduleId: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 border-t border-border/70 pt-4">
      <p className="text-sm text-muted">
        This removes the module, files, and quiz. Students lose access immediately.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className="mt-4"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this module and its files?")) return;
          const formData = new FormData();
          formData.set("id", moduleId);
          startTransition(async () => {
            const result = await deleteCourseModule(formData);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        {pending ? "Deleting..." : "Delete module"}
      </Button>
    </div>
  );
}
