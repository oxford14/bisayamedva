"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { portfolioCopy } from "@/content/site";
import { PortfolioBlockView } from "@/lib/member/portfolio/render-blocks";
import type {
  PortfolioBlock,
  PortfolioThemeId,
} from "@/lib/member/portfolio/types";
import { cn } from "@/lib/utils";

const PORTFOLIO_DND_CONTEXT_ID = "portfolio-visual-canvas-dnd";

type BlockChromeProps = {
  block: PortfolioBlock;
  themeId: PortfolioThemeId;
  avatarUrl?: string | null;
  previewUrls: Record<string, string>;
  selected: boolean;
  onSelect: () => void;
  onRequestEdit: () => void;
  onInlineChange: (block: PortfolioBlock) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  dragHandle?: ReactNode;
};

function VisualBlockChrome({
  block,
  themeId,
  avatarUrl,
  previewUrls,
  selected,
  onSelect,
  onRequestEdit,
  onInlineChange,
  onDuplicate,
  onRemove,
  dragHandle,
}: BlockChromeProps) {
  return (
    <div className={cn("group relative")}>
      <div
        className={cn(
          "absolute -left-1 top-6 z-20 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 lg:-left-12",
          selected && "opacity-100",
        )}
      >
        {dragHandle}
        <button
          type="button"
          className="rounded-lg border border-navy/10 bg-white p-1.5 text-navy/60 shadow-sm"
          aria-label="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="size-4" />
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600/80 shadow-sm"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(portfolioCopy.deleteBlockConfirm)) onRemove();
          }}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <PortfolioBlockView
        block={block}
        themeId={themeId}
        avatarUrl={avatarUrl}
        mode="canvas"
        previewUrls={previewUrls}
        selected={selected}
        onSelect={onSelect}
        onRequestEdit={onRequestEdit}
        onInlineChange={onInlineChange}
      />
    </div>
  );
}

function SortableVisualBlock(props: Omit<BlockChromeProps, "dragHandle">) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      className="cursor-grab rounded-lg border border-navy/10 bg-white p-1.5 text-navy/60 shadow-sm active:cursor-grabbing"
      aria-label={portfolioCopy.dragHint}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-20 opacity-95")}
    >
      <VisualBlockChrome {...props} dragHandle={dragHandle} />
    </div>
  );
}

function StaticVisualBlock(props: Omit<BlockChromeProps, "dragHandle">) {
  return (
    <VisualBlockChrome
      {...props}
      dragHandle={
        <span
          className="flex size-[34px] items-center justify-center rounded-lg border border-navy/10 bg-white p-1.5 text-navy/30 shadow-sm"
          aria-hidden
        >
          <GripVertical className="size-4" />
        </span>
      }
    />
  );
}

function CanvasBlockList({
  blocks,
  themeId,
  avatarUrl,
  previewUrls,
  selectedBlockId,
  onBlocksChange,
  onSelectBlock,
  onRequestEdit,
  onDuplicateBlock,
  onRemoveBlock,
  sortable,
  onDragEnd,
}: {
  blocks: PortfolioBlock[];
  themeId: PortfolioThemeId;
  avatarUrl?: string | null;
  previewUrls: Record<string, string>;
  selectedBlockId: string | null;
  onBlocksChange: (blocks: PortfolioBlock[]) => void;
  onSelectBlock: (id: string) => void;
  onRequestEdit: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onRemoveBlock: (id: string) => void;
  sortable: boolean;
  onDragEnd?: (event: DragEndEvent) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function updateBlock(next: PortfolioBlock) {
    onBlocksChange(blocks.map((b) => (b.id === next.id ? next : b)));
  }

  const list = (
    <div className="mx-auto max-w-3xl space-y-8">
      {blocks.map((block) => {
        const shared = {
          block,
          themeId,
          avatarUrl,
          previewUrls,
          selected: selectedBlockId === block.id,
          onSelect: () => onSelectBlock(block.id),
          onRequestEdit: () => onRequestEdit(block.id),
          onInlineChange: updateBlock,
          onDuplicate: () => onDuplicateBlock(block.id),
          onRemove: () => onRemoveBlock(block.id),
        };
        return sortable ? (
          <SortableVisualBlock key={block.id} {...shared} />
        ) : (
          <StaticVisualBlock key={block.id} {...shared} />
        );
      })}
    </div>
  );

  if (!sortable) return list;

  return (
    <DndContext
      id={PORTFOLIO_DND_CONTEXT_ID}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        {list}
      </SortableContext>
    </DndContext>
  );
}

export function PortfolioVisualCanvas({
  blocks,
  themeId,
  avatarUrl,
  previewUrls,
  selectedBlockId,
  onBlocksChange,
  onSelectBlock,
  onRequestEdit,
  onDuplicateBlock,
  onRemoveBlock,
}: {
  blocks: PortfolioBlock[];
  themeId: PortfolioThemeId;
  avatarUrl?: string | null;
  previewUrls: Record<string, string>;
  selectedBlockId: string | null;
  onBlocksChange: (blocks: PortfolioBlock[]) => void;
  onSelectBlock: (id: string) => void;
  onRequestEdit: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onRemoveBlock: (id: string) => void;
}) {
  const [sortableReady, setSortableReady] = useState(false);
  const mountId = useId();

  useEffect(() => {
    setSortableReady(true);
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <div className="min-h-[480px] rounded-[2rem] border border-navy/10 bg-cream bg-grid pb-24 lg:pb-12">
      <p className="border-b border-navy/10 bg-white/70 px-4 py-2 text-center text-xs text-muted lg:text-left">
        {portfolioCopy.canvasHint}
      </p>
      <div className="px-2 py-6 sm:px-4" suppressHydrationWarning={!sortableReady}>
        <CanvasBlockList
          key={sortableReady ? `${mountId}-dnd` : `${mountId}-static`}
          blocks={blocks}
          themeId={themeId}
          avatarUrl={avatarUrl}
          previewUrls={previewUrls}
          selectedBlockId={selectedBlockId}
          onBlocksChange={onBlocksChange}
          onSelectBlock={onSelectBlock}
          onRequestEdit={onRequestEdit}
          onDuplicateBlock={onDuplicateBlock}
          onRemoveBlock={onRemoveBlock}
          sortable={sortableReady}
          onDragEnd={handleDragEnd}
        />
        {blocks.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            {portfolioCopy.canvasEmpty}
          </p>
        ) : null}
      </div>
    </div>
  );
}
