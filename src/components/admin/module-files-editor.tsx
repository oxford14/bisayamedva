"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmModuleFileUpload,
  deleteModuleFile,
  prepareModuleFileUpload,
} from "@/app/(admin)/admin/modules-actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  MODULE_FILES_BUCKET,
  formatByteSize,
  inferModuleMimeType,
} from "@/lib/modules/storage";

export type AdminModuleFile = {
  id: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
};

export function ModuleFilesEditor({
  moduleId,
  files,
}: {
  moduleId: string;
  files: AdminModuleFile[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Upload module file</span>
        <input
          type="file"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-[10px] file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setError("");
            setProgress("Preparing upload…");
            startTransition(async () => {
              const mimeType = inferModuleMimeType(file.name, file.type);
              const prepared = await prepareModuleFileUpload({
                moduleId,
                fileName: file.name,
                mimeType,
                byteSize: file.size,
              });
              if (!prepared.ok) {
                setProgress("");
                setError(prepared.error);
                return;
              }
              setProgress("Uploading…");
              const supabase = createClient();
              const { error: uploadError } = await supabase.storage
                .from(MODULE_FILES_BUCKET)
                .uploadToSignedUrl(prepared.path, prepared.token, file);
              if (uploadError) {
                setProgress("");
                setError(uploadError.message || "Upload failed.");
                return;
              }
              const confirmed = await confirmModuleFileUpload({
                moduleId,
                storagePath: prepared.path,
                fileName: file.name,
                mimeType,
                byteSize: file.size,
              });
              setProgress("");
              if (!confirmed.ok) {
                setError(confirmed.error);
                return;
              }
              router.refresh();
            });
          }}
        />
      </label>
      <p className="text-xs text-muted">
        PDF, MP4/WebM, or common documents. Videos up to 100 MB. Other files up to 20 MB.
      </p>
      {progress ? <p className="text-sm text-navy">{progress}</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {files.length === 0 ? (
        <p className="text-sm text-muted">No files yet.</p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{file.fileName}</p>
                <p className="text-xs text-muted">
                  {file.mimeType} · {formatByteSize(file.byteSize)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  const formData = new FormData();
                  formData.set("id", file.id);
                  startTransition(async () => {
                    const result = await deleteModuleFile(formData);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    router.refresh();
                  });
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
