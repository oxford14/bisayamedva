"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { PortfolioBlockEditor } from "@/components/member/portfolio/portfolio-block-editor";
import { BLOCK_LABELS } from "@/components/member/portfolio/portfolio-block-labels";
import { Button } from "@/components/ui/button";
import { portfolioCopy } from "@/content/site";
import type { PortfolioBlock } from "@/lib/member/portfolio/types";
import { cn } from "@/lib/utils";

export function PortfolioBlockPanel({
  open,
  block,
  onClose,
  onChange,
  onUploadImage,
  imagePreviewUrl,
  uploadPending,
  variant,
}: {
  open: boolean;
  block: PortfolioBlock | null;
  onClose: () => void;
  onChange: (block: PortfolioBlock) => void;
  onUploadImage: (blockId: string, file: File) => void;
  imagePreviewUrl?: string | null;
  uploadPending?: boolean;
  variant: "desktop" | "mobile";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !block) return null;

  const title = BLOCK_LABELS[block.type];

  const body = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-navy/10 px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-navy/50 uppercase">
            {portfolioCopy.editBlock}
          </p>
          <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="max-h-[min(70vh,640px)] overflow-y-auto p-4">
        <PortfolioBlockEditor
          block={block}
          onChange={onChange}
          onUploadImage={onUploadImage}
          imagePreviewUrl={imagePreviewUrl}
          uploadPending={uploadPending}
        />
      </div>
    </>
  );

  if (variant === "mobile") {
    return (
      <>
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-[60] bg-navy/40"
          onClick={onClose}
        />
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-[70] rounded-t-[1.5rem] border border-navy/10 bg-white shadow-[0_-16px_40px_rgba(47,56,38,0.12)]",
            "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]",
          )}
        >
          {body}
        </div>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 hidden bg-navy/20 lg:block"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-full max-w-md flex-col border-l border-navy/10 bg-white shadow-[-12px_0_40px_rgba(47,56,38,0.08)] lg:flex">
        {body}
      </aside>
    </>
  );
}
