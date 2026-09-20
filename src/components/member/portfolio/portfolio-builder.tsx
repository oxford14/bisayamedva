"use client";

import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  savePortfolioDraft,
  updatePortfolioSettings,
  uploadPortfolioImage,
} from "@/app/(member)/member/portfolio-actions";
import { PortfolioBlockPanel } from "@/components/member/portfolio/portfolio-block-panel";
import { duplicateBlock } from "@/lib/member/portfolio/blocks-factory";
import { optimizePortfolioImage } from "@/lib/member/portfolio/optimize-image";
import { PortfolioSettingsRail } from "@/components/member/portfolio/portfolio-settings-rail";
import { PortfolioVisualCanvas } from "@/components/member/portfolio/portfolio-visual-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portfolioCopy } from "@/content/site";
import type {
  PortfolioBlock,
  PortfolioRow,
  PortfolioThemeId,
} from "@/lib/member/portfolio/types";
import {
  PortfolioMobileHomeToolbarItem,
  portfolioMobileToolbarNavClass,
} from "@/components/member/portfolio/portfolio-mobile-sticky-toolbar";
import { cn } from "@/lib/utils";

type MobileSheet = "add" | "edit" | "more" | null;

export function PortfolioBuilder({
  initial,
  initialPreviewUrls,
  avatarUrl,
}: {
  initial: PortfolioRow;
  initialPreviewUrls: Record<string, string>;
  avatarUrl?: string | null;
}) {
  const [blocks, setBlocks] = useState<PortfolioBlock[]>(initial.blocks);
  const [themeId] = useState<PortfolioThemeId>(initial.theme_id);
  const [slug, setSlug] = useState(initial.slug);
  const [isPublic, setIsPublic] = useState(initial.is_public);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [previewUrls, setPreviewUrls] =
    useState<Record<string, string>>(initialPreviewUrls);
  const [uploadPending, setUploadPending] = useState(false);
  const [settingsPending, startSettings] = useTransition();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [isMobile, setIsMobile] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const selectedBlock =
    blocks.find((b) => b.id === selectedBlockId) ?? null;

  const persistDraft = useCallback(async () => {
    setSaveState("saving");
    const result = await savePortfolioDraft(
      JSON.stringify({ blocks: blocksRef.current, themeId }),
    );
    setSaveState(result.ok ? "saved" : "error");
  }, [themeId]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("idle");
    saveTimer.current = setTimeout(() => {
      void persistDraft();
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [blocks, persistDraft]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function updateBlock(id: string, next: PortfolioBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)));
  }

  async function handleUpload(blockId: string, file: File) {
    setUploadPending(true);
    let uploadFile = file;
    try {
      uploadFile = await optimizePortfolioImage(file);
    } catch (err) {
      setUploadPending(false);
      alert(err instanceof Error ? err.message : "Could not optimize image.");
      return;
    }
    const fd = new FormData();
    fd.set("file", uploadFile);
    const result = await uploadPortfolioImage(blockId, fd);
    setUploadPending(false);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    if (!result.imagePath) return;

    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        if (b.type === "hero") {
          return {
            ...b,
            props: { ...b.props, imagePath: result.imagePath! },
          };
        }
        if (b.type === "image") {
          return {
            ...b,
            props: { ...b.props, imagePath: result.imagePath! },
          };
        }
        return b;
      }),
    );

    const block = blocks.find((b) => b.id === blockId);
    const key =
      block?.type === "hero" ? `${blockId}:hero` : `${blockId}:image`;
    setPreviewUrls((prev) => ({
      ...prev,
      [key]: URL.createObjectURL(uploadFile),
    }));
  }

  function previewUrlForBlock(block: PortfolioBlock | null) {
    if (!block) return null;
    if (block.type === "hero") return previewUrls[`${block.id}:hero`];
    if (block.type === "image") return previewUrls[`${block.id}:image`];
    return null;
  }

  function applySettings(isPublicNext: boolean, slugNext: string) {
    startSettings(async () => {
      const result = await updatePortfolioSettings(slugNext, isPublicNext);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      if (result.slug) setSlug(result.slug);
      setIsPublic(isPublicNext);
    });
  }

  function openEditPanel(id: string) {
    setSelectedBlockId(id);
    setPanelOpen(true);
    if (isMobile) setMobileSheet("edit");
  }

  function closePanel() {
    setPanelOpen(false);
    if (mobileSheet === "edit") setMobileSheet(null);
  }

  const publicPath = `/portfolio/${slug}`;

  function copyPublicLink() {
    const full =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicPath}`
        : publicPath;
    void navigator.clipboard.writeText(full);
  }

  const saveLabel =
    saveState === "saving"
      ? portfolioCopy.saving
      : saveState === "saved"
        ? portfolioCopy.saved
        : saveState === "error"
          ? portfolioCopy.saveError
          : portfolioCopy.unsaved;

  return (
    <div className="space-y-4">
      <div className="hidden flex-col gap-4 rounded-2xl border border-navy/10 bg-white p-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">{saveLabel}</span>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/portfolio/preview" target="_blank">
              {portfolioCopy.preview}
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
            <input
              type="checkbox"
              className="size-4 rounded border-navy/30"
              checked={isPublic}
              disabled={settingsPending}
              onChange={(e) => applySettings(e.target.checked, slug)}
            />
            {portfolioCopy.publicToggle}
          </label>
          {isPublic ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-cream px-2 py-1 text-xs">{publicPath}</code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyPublicLink}
              >
                {portfolioCopy.copyLink}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted">{portfolioCopy.privateNote}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden lg:block">
          <PortfolioSettingsRail
            slug={slug}
            onSlugChange={setSlug}
            onSlugBlur={() => applySettings(isPublic, slug)}
            onAddBlock={(block) => setBlocks((b) => [...b, block])}
          />
        </aside>

        <PortfolioVisualCanvas
          blocks={blocks}
          themeId={themeId}
          avatarUrl={avatarUrl}
          previewUrls={previewUrls}
          selectedBlockId={selectedBlockId}
          onBlocksChange={setBlocks}
          onSelectBlock={setSelectedBlockId}
          onRequestEdit={openEditPanel}
          onDuplicateBlock={(id) =>
            setBlocks((prev) => {
              const block = prev.find((b) => b.id === id);
              if (!block) return prev;
              const idx = prev.findIndex((b) => b.id === id);
              const copy = duplicateBlock(block);
              const next = [...prev];
              next.splice(idx + 1, 0, copy);
              return next;
            })
          }
          onRemoveBlock={(id) => {
            setBlocks((prev) => prev.filter((b) => b.id !== id));
            if (selectedBlockId === id) closePanel();
          }}
        />
      </div>

      <PortfolioBlockPanel
        open={panelOpen && Boolean(selectedBlock)}
        block={selectedBlock}
        onClose={closePanel}
        onChange={(next) => updateBlock(next.id, next)}
        onUploadImage={handleUpload}
        imagePreviewUrl={previewUrlForBlock(selectedBlock)}
        uploadPending={uploadPending}
        variant={isMobile ? "mobile" : "desktop"}
      />

      {mobileSheet === "add" ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-navy/40 lg:hidden"
            aria-label="Close"
            onClick={() => setMobileSheet(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[70vh] overflow-y-auto rounded-t-[1.5rem] border border-navy/10 bg-white p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden">
            <PortfolioSettingsRail
              slug={slug}
              onSlugChange={setSlug}
              onSlugBlur={() => applySettings(isPublic, slug)}
              showSlug={false}
              showTemplateReset={false}
              onAddBlock={(block) => {
                setBlocks((b) => [...b, block]);
                setMobileSheet(null);
              }}
            />
          </div>
        </>
      ) : null}

      {mobileSheet === "more" ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-navy/40 lg:hidden"
            aria-label="Close"
            onClick={() => setMobileSheet(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-[1.5rem] border border-navy/10 bg-white p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden">
            <p className="text-sm text-muted">{saveLabel}</p>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
              <input
                type="checkbox"
                className="size-4 rounded border-navy/30"
                checked={isPublic}
                disabled={settingsPending}
                onChange={(e) => applySettings(e.target.checked, slug)}
              />
              {portfolioCopy.publicToggle}
            </label>
            {isPublic ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={copyPublicLink}
              >
                {portfolioCopy.copyLink}
              </Button>
            ) : (
              <p className="mt-2 text-xs text-muted">{portfolioCopy.privateNote}</p>
            )}
            <div className="mt-4">
              <p className="text-xs font-semibold tracking-wide text-navy/60 uppercase">
                {portfolioCopy.urlSlug}
              </p>
              <Input
                className="mt-2"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={() => applySettings(isPublic, slug)}
              />
              <p className="mt-1 text-xs text-muted">{publicPath}</p>
            </div>
          </div>
        </>
      ) : null}

      <nav
        className={portfolioMobileToolbarNavClass}
        aria-label={portfolioCopy.mobileToolbarLabel}
      >
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-0.5 px-1.5 py-2">
          <PortfolioMobileHomeToolbarItem />
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-navy"
            onClick={() => setMobileSheet("add")}
          >
            <Plus className="size-5" />
            {portfolioCopy.mobileAdd}
          </button>
          <button
            type="button"
            disabled={!selectedBlockId}
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-navy disabled:opacity-40"
            onClick={() => selectedBlockId && openEditPanel(selectedBlockId)}
          >
            <Pencil className="size-5" />
            {portfolioCopy.mobileEdit}
          </button>
          <Link
            href="/portfolio/preview"
            target="_blank"
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-navy"
          >
            <ExternalLink className="size-5" />
            {portfolioCopy.preview}
          </Link>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-navy"
            onClick={() => applySettings(!isPublic, slug)}
          >
            <Globe className={cn("size-5", isPublic && "text-teal")} />
            {portfolioCopy.mobilePublic}
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-navy"
            onClick={() => setMobileSheet("more")}
          >
            <MoreHorizontal className="size-5" />
            {portfolioCopy.mobileMore}
          </button>
        </div>
      </nav>
    </div>
  );
}
