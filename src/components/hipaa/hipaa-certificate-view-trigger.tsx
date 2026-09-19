"use client";

import { useState, useTransition } from "react";
import { hipaaCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import {
  HipaaCertificateViewerDialog,
  type HipaaCertificateViewerAsset,
} from "@/components/hipaa/hipaa-certificate-viewer-dialog";

type FetchAsset = () => Promise<
  { ok: true; url: string; mimeType: string; fileName: string } | { ok: false; error: string }
>;

type Props = {
  label?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  className?: string;
  fetchAsset: FetchAsset;
  canReplace?: boolean;
  canDelete?: boolean;
  onReplaceFile?: (file: File) => void;
  onDelete?: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function HipaaCertificateViewTrigger({
  label = hipaaCopy.viewUpload,
  buttonVariant = "secondary",
  buttonSize = "sm",
  className,
  fetchAsset,
  canReplace = false,
  canDelete = false,
  onReplaceFile,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<HipaaCertificateViewerAsset | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const loadAndOpen = () => {
    setFetchError("");
    setOpen(true);
    startTransition(async () => {
      const result = await fetchAsset();
      if (!result.ok) {
        setFetchError(result.error);
        setAsset(null);
        return;
      }
      setAsset({
        url: result.url,
        mimeType: result.mimeType,
        fileName: result.fileName,
      });
    });
  };

  const handleReplace = (file: File) => {
    if (!onReplaceFile) return;
    setOpen(false);
    setAsset(null);
    onReplaceFile(file);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    startDelete(async () => {
      const result = await onDelete();
      if (!result.ok) {
        setFetchError(result.error);
        return;
      }
      setOpen(false);
      setAsset(null);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        disabled={pending}
        onClick={loadAndOpen}
      >
        {label}
      </Button>
      <HipaaCertificateViewerDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setFetchError("");
        }}
        asset={asset}
        loading={pending && !asset && !fetchError}
        error={fetchError}
        canReplace={canReplace}
        canDelete={canDelete}
        deletePending={deletePending}
        onReplaceFile={onReplaceFile ? handleReplace : undefined}
        onDelete={onDelete ? handleDelete : undefined}
      />
    </>
  );
}
