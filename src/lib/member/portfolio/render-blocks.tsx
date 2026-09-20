import type { ReactNode } from "react";
import { portfolioCopy } from "@/content/site";
import type { PortfolioBlock, PortfolioThemeId } from "@/lib/member/portfolio/types";
import { cn } from "@/lib/utils";

function isHttpUrl(path: string | null) {
  return Boolean(path && /^https?:\/\//i.test(path));
}

function isBlobUrl(path: string | null) {
  return Boolean(path && path.startsWith("blob:"));
}

export function resolvePreviewImage(
  blockId: string,
  kind: "hero" | "image",
  imagePath: string | null | undefined,
  previewUrls?: Record<string, string>,
): string | null {
  const key = `${blockId}:${kind}`;
  if (previewUrls?.[key]) return previewUrls[key];
  if (imagePath && (isHttpUrl(imagePath) || isBlobUrl(imagePath))) {
    return imagePath;
  }
  return null;
}

export type PortfolioBlocksViewProps = {
  blocks: PortfolioBlock[];
  themeId: PortfolioThemeId;
  avatarUrl?: string | null;
  mode?: "view" | "canvas";
  previewUrls?: Record<string, string>;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  onRequestEdit?: (id: string) => void;
  onInlineChange?: (block: PortfolioBlock) => void;
  compact?: boolean;
};

export function PortfolioBlocksView({
  blocks,
  themeId,
  avatarUrl,
  mode = "view",
  previewUrls,
  selectedBlockId,
  onSelectBlock,
  onRequestEdit,
  onInlineChange,
  compact = false,
}: PortfolioBlocksViewProps) {
  return (
    <div
      data-theme={themeId}
      className={cn(
        "mx-auto max-w-3xl space-y-10 text-ink",
        compact ? "space-y-6 px-2 py-2" : "px-4 py-12 sm:px-8",
      )}
    >
      {blocks.map((block) => (
        <PortfolioBlockView
          key={block.id}
          block={block}
          themeId={themeId}
          avatarUrl={avatarUrl}
          mode={mode}
          previewUrls={previewUrls}
          selected={selectedBlockId === block.id}
          onSelect={onSelectBlock ? () => onSelectBlock(block.id) : undefined}
          onRequestEdit={
            onRequestEdit ? () => onRequestEdit(block.id) : undefined
          }
          onInlineChange={onInlineChange}
        />
      ))}
    </div>
  );
}

export type PortfolioBlockViewProps = {
  block: PortfolioBlock;
  themeId: PortfolioThemeId;
  avatarUrl?: string | null;
  mode?: "view" | "canvas";
  previewUrls?: Record<string, string>;
  selected?: boolean;
  onSelect?: () => void;
  onRequestEdit?: () => void;
  onInlineChange?: (block: PortfolioBlock) => void;
};

function CanvasShell({
  children,
  selected,
  onSelect,
  onDoubleEdit,
  label,
}: {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  onDoubleEdit?: () => void;
  label: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleEdit?.();
      }}
      className={cn(
        "relative rounded-2xl transition-[box-shadow,outline]",
        selected
          ? "ring-2 ring-teal ring-offset-2 ring-offset-cream"
          : "hover:ring-2 hover:ring-navy/15 hover:ring-offset-2 hover:ring-offset-cream",
      )}
    >
      <span className="pointer-events-none absolute -top-2.5 left-3 z-10 rounded-md bg-navy px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cream uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function placeholder(text: string) {
  return <span className="text-muted/70 italic">{text}</span>;
}

export function PortfolioBlockView({
  block,
  themeId,
  avatarUrl,
  mode = "view",
  previewUrls,
  selected,
  onSelect,
  onRequestEdit,
  onInlineChange,
}: PortfolioBlockViewProps) {
  const canvas = mode === "canvas";
  const label =
    block.type === "divider"
      ? "Divider"
      : block.type.charAt(0).toUpperCase() + block.type.slice(1);

  const wrap = (node: React.ReactNode) =>
    canvas ? (
      <CanvasShell
        selected={selected}
        onSelect={onSelect}
        onDoubleEdit={onRequestEdit}
        label={label}
      >
        {node}
      </CanvasShell>
    ) : (
      node
    );

  switch (block.type) {
    case "hero": {
      const heroSrc =
        resolvePreviewImage(
          block.id,
          "hero",
          block.props.imagePath,
          previewUrls,
        ) ?? avatarUrl;
      const content = (
        <header
          className={cn(
            "rounded-[2rem] border p-8 sm:p-10",
            themeId === "classic" &&
              "border-navy/15 bg-white shadow-[0_20px_50px_rgba(91,109,73,0.1)]",
            themeId === "minimal" && "border-border bg-white",
            themeId === "visual" &&
              "border-teal/25 bg-gradient-to-br from-teal/10 to-cream",
          )}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {heroSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroSrc}
                alt=""
                className="size-28 shrink-0 rounded-2xl border border-navy/10 object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex size-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-navy/20 bg-navy/5 text-center text-xs text-muted",
                  canvas && "cursor-pointer",
                )}
                onClick={(e) => {
                  if (canvas) {
                    e.stopPropagation();
                    onRequestEdit?.();
                  }
                }}
              >
                {canvas ? (
                  <>
                    <span className="font-semibold text-navy/70">Photo</span>
                    <span className="mt-1 px-2">{portfolioCopy.canvasUploadHint}</span>
                  </>
                ) : (
                  <span className="font-display text-3xl font-semibold text-navy">
                    {(block.props.displayName || "?").charAt(0)}
                  </span>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {canvas && onInlineChange ? (
                <>
                  <input
                    className="w-full bg-transparent font-display text-3xl font-semibold text-navy outline-none sm:text-4xl"
                    value={block.props.displayName}
                    placeholder={portfolioCopy.canvasNamePlaceholder}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      onInlineChange({
                        ...block,
                        props: {
                          ...block.props,
                          displayName: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    className="mt-2 w-full bg-transparent text-lg text-muted outline-none"
                    value={block.props.headline}
                    placeholder={portfolioCopy.canvasHeadlinePlaceholder}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      onInlineChange({
                        ...block,
                        props: {
                          ...block.props,
                          headline: e.target.value,
                        },
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
                    {block.props.displayName || "Your name"}
                  </h1>
                  <p className="mt-2 text-lg text-muted">
                    {block.props.headline ||
                      (canvas ? placeholder(portfolioCopy.canvasHeadlinePlaceholder) : "")}
                  </p>
                </>
              )}
            </div>
          </div>
        </header>
      );
      return wrap(content);
    }
    case "about": {
      const content = (
        <section className={canvas ? "px-1 pt-2 pb-1" : undefined}>
          {canvas && onInlineChange ? (
            <>
              <input
                className="w-full bg-transparent font-display text-xl font-semibold text-navy outline-none"
                value={block.props.title}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  onInlineChange({
                    ...block,
                    props: { ...block.props, title: e.target.value },
                  })
                }
              />
              <textarea
                className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-muted outline-none sm:text-base"
                rows={4}
                value={block.props.body}
                placeholder={portfolioCopy.canvasAboutPlaceholder}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  onInlineChange({
                    ...block,
                    props: { ...block.props, body: e.target.value },
                  })
                }
              />
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-navy">
                {block.props.title}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
                {block.props.body ||
                  (canvas ? placeholder(portfolioCopy.canvasAboutPlaceholder) : "")}
              </p>
            </>
          )}
        </section>
      );
      return wrap(content);
    }
    case "skills": {
      const items = block.props.items.filter(Boolean);
      const content = (
        <section className={canvas ? "px-1 pt-2 pb-1" : undefined}>
          <h2 className="font-display text-xl font-semibold text-navy">
            {block.props.title}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {items.length > 0 ? (
              items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-sm font-medium text-navy"
                >
                  {item}
                </li>
              ))
            ) : canvas ? (
              <li className="text-sm">{placeholder(portfolioCopy.canvasEditSkillsHint)}</li>
            ) : null}
          </ul>
        </section>
      );
      return wrap(content);
    }
    case "experience": {
      const content = (
        <section className={canvas ? "px-1 pt-2 pb-1" : undefined}>
          <h2 className="font-display text-xl font-semibold text-navy">
            {block.props.title}
          </h2>
          <ul className="mt-4 space-y-6">
            {block.props.entries.map((entry, i) => (
              <li
                key={`${entry.role}-${i}`}
                className="border-l-2 border-navy/15 pl-4"
              >
                <p className="font-semibold text-ink">
                  {entry.role || (canvas ? placeholder("Role") : "")}
                </p>
                <p className="text-sm text-muted">
                  {entry.organization}
                  {entry.period ? ` · ${entry.period}` : ""}
                </p>
                {entry.bullets.filter(Boolean).length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
                    {entry.bullets.filter(Boolean).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          {canvas && block.props.entries.every((e) => !e.role) ? (
            <p className="mt-2 text-sm">{placeholder(portfolioCopy.canvasEditListHint)}</p>
          ) : null}
        </section>
      );
      return wrap(content);
    }
    case "certifications": {
      const content = (
        <section className={canvas ? "px-1 pt-2 pb-1" : undefined}>
          <h2 className="font-display text-xl font-semibold text-navy">
            {block.props.title}
          </h2>
          <ul className="mt-4 space-y-3">
            {block.props.items.map((item, i) => (
              <li
                key={`${item.name}-${i}`}
                className="rounded-xl border border-navy/10 bg-white px-4 py-3"
              >
                <p className="font-semibold text-ink">
                  {item.name || (canvas ? placeholder("Certificate") : "")}
                </p>
                <p className="text-sm text-muted">
                  {item.issuer}
                  {item.year ? ` · ${item.year}` : ""}
                </p>
                {item.link && !canvas ? (
                  <a
                    href={item.link}
                    className="mt-1 inline-block text-sm font-medium text-teal underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View link
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      );
      return wrap(content);
    }
    case "image": {
      const src = resolvePreviewImage(
        block.id,
        "image",
        block.props.imagePath,
        previewUrls,
      );
      const content = src ? (
        <figure className={canvas ? "px-1 pt-2 pb-1" : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={block.props.alt || block.props.caption || "Portfolio image"}
            className="w-full rounded-2xl border border-navy/10 object-cover"
          />
          {block.props.caption ? (
            <figcaption className="mt-2 text-center text-sm text-muted">
              {block.props.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : canvas ? (
        <div
          className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-navy/25 bg-white/80 px-4 py-8 text-center text-sm text-muted"
          onClick={(e) => {
            e.stopPropagation();
            onRequestEdit?.();
          }}
        >
          <span className="font-semibold text-navy">{portfolioCopy.canvasImageEmpty}</span>
          <span className="mt-1">{portfolioCopy.canvasUploadHint}</span>
        </div>
      ) : null;
      if (!content) return null;
      return wrap(content);
    }
    case "links": {
      const visible = block.props.links.filter((l) => l.label && l.url);
      const content = (
        <section className={canvas ? "px-1 pt-2 pb-1" : undefined}>
          <h2 className="font-display text-xl font-semibold text-navy">
            {block.props.title}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {visible.length > 0 ? (
              visible.map((link) => (
                <li key={`${link.label}-${link.url}`}>
                  {canvas ? (
                    <span className="inline-flex items-center rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-navy">
                      {link.label}
                    </span>
                  ) : (
                    <a
                      href={link.url}
                      className="inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-navy transition hover:border-teal/40 hover:bg-teal/5"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))
            ) : canvas ? (
              <li className="text-sm">{placeholder(portfolioCopy.canvasEditLinksHint)}</li>
            ) : null}
          </ul>
        </section>
      );
      return wrap(content);
    }
    case "divider": {
      const content = <hr className="border-navy/10" />;
      return wrap(content);
    }
    default:
      return null;
  }
}
