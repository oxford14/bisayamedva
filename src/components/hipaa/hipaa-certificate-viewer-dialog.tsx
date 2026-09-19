"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { hipaaCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { hipaaCertificateAcceptAttribute } from "@/lib/hipaa/storage";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export type HipaaCertificateViewerAsset = {
  url: string;
  mimeType: string;
  fileName: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  asset: HipaaCertificateViewerAsset | null;
  loading?: boolean;
  error?: string;
  canReplace?: boolean;
  canDelete?: boolean;
  deletePending?: boolean;
  onReplaceFile?: (file: File) => void;
  onDelete?: () => void;
};

function isPdfAsset(mimeType: string, fileName: string) {
  const mime = mimeType.toLowerCase();
  return mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export function HipaaCertificateViewerDialog({
  open,
  onClose,
  asset,
  loading = false,
  error = "",
  canReplace = false,
  canDelete = false,
  deletePending = false,
  onReplaceFile,
  onDelete,
}: Props) {
  const titleId = useId();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) setZoom(1);
  }, [open, asset?.url]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const zoomIn = useCallback(() => {
    setZoom((value) => Math.min(MAX_ZOOM, Math.round((value + ZOOM_STEP) * 100) / 100));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((value) => Math.max(MIN_ZOOM, Math.round((value - ZOOM_STEP) * 100) / 100));
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  if (!open) return null;

  const pdf = asset ? isPdfAsset(asset.mimeType, asset.fileName) : false;
  const busy = loading || deletePending;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-cream shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {asset?.fileName ?? hipaaCopy.viewerTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy || !asset}
              onClick={zoomOut}
              aria-label={hipaaCopy.viewerZoomOut}
            >
              −
            </Button>
            <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy || !asset}
              onClick={zoomIn}
              aria-label={hipaaCopy.viewerZoomIn}
            >
              +
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy || !asset || zoom === 1}
              onClick={resetZoom}
            >
              {hipaaCopy.viewerResetZoom}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {hipaaCopy.viewerClose}
            </Button>
          </div>
        </div>

        <div className="relative min-h-[min(420px,50dvh)] flex-1 overflow-auto bg-[#1a1f2e]">
          {loading ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-cream/80">
              {hipaaCopy.viewerLoading}
            </p>
          ) : error ? (
            <p className="absolute inset-0 flex items-center justify-center px-4 text-sm text-destructive">
              {error}
            </p>
          ) : asset ? (
            pdf ? (
              <div
                className="origin-top-left"
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  transform: `scale(${zoom})`,
                }}
              >
                <iframe
                  title={asset.fileName}
                  src={asset.url}
                  className="h-[min(70dvh,640px)] w-full bg-white"
                />
              </div>
            ) : (
              <div className="flex min-h-[min(420px,50dvh)] items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.fileName}
                  className="max-h-none max-w-none select-none"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                  draggable={false}
                />
              </div>
            )
          ) : null}
        </div>

        {(canReplace || canDelete) && asset ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            {canReplace && onReplaceFile ? (
              <>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept={hipaaCertificateAcceptAttribute()}
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) onReplaceFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={busy}
                  onClick={() => replaceInputRef.current?.click()}
                >
                  {hipaaCopy.viewerReplace}
                </Button>
              </>
            ) : null}
            {canDelete && onDelete ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (window.confirm(hipaaCopy.viewerDeleteConfirm)) onDelete();
                }}
              >
                {deletePending ? hipaaCopy.viewerDeleting : hipaaCopy.viewerDelete}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
