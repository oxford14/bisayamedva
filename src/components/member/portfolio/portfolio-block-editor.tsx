"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { portfolioCopy } from "@/content/site";
import type { PortfolioBlock } from "@/lib/member/portfolio/types";
import { Button } from "@/components/ui/button";

function FieldTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-base text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors placeholder:text-muted/70 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

type Props = {
  block: PortfolioBlock;
  onChange: (block: PortfolioBlock) => void;
  onUploadImage: (blockId: string, file: File) => void;
  imagePreviewUrl?: string | null;
  uploadPending?: boolean;
};

export function PortfolioBlockEditor({
  block,
  onChange,
  onUploadImage,
  imagePreviewUrl,
  uploadPending,
}: Props) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-navy/70">
            Display name
            <Input
              className="mt-1"
              value={block.props.displayName}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, displayName: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-xs font-semibold text-navy/70">
            Headline
            <Input
              className="mt-1"
              value={block.props.headline}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, headline: e.target.value },
                })
              }
            />
          </label>
          <div>
            <p className="text-xs font-semibold text-navy/70">Hero photo</p>
            {imagePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreviewUrl}
                alt=""
                className="mt-2 h-24 w-24 rounded-xl object-cover"
              />
            ) : null}
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2"
              disabled={uploadPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadImage(block.id, file);
              }}
            />
            {uploadPending ? (
              <p className="mt-1 text-xs text-muted">{portfolioCopy.imageOptimizing}</p>
            ) : null}
          </div>
        </div>
      );
    case "about":
      return (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-navy/70">
            Section title
            <Input
              className="mt-1"
              value={block.props.title}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-xs font-semibold text-navy/70">
            About text
            <FieldTextarea
              className="mt-1 min-h-[120px]"
              value={block.props.body}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, body: e.target.value },
                })
              }
            />
          </label>
        </div>
      );
    case "skills":
      return (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-navy/70">
            Section title
            <Input
              className="mt-1"
              value={block.props.title}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-xs font-semibold text-navy/70">
            Skills (one per line)
            <FieldTextarea
              className="mt-1 min-h-[100px]"
              value={block.props.items.join("\n")}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: {
                    ...block.props,
                    items: e.target.value.split("\n").map((s) => s.trim()),
                  },
                })
              }
            />
          </label>
        </div>
      );
    case "experience":
      return (
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-navy/70">
            Section title
            <Input
              className="mt-1"
              value={block.props.title}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value },
                })
              }
            />
          </label>
          {block.props.entries.map((entry, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-navy/10 bg-cream/50 p-3 space-y-2"
            >
              <Input
                placeholder="Role"
                value={entry.role}
                onChange={(e) => {
                  const entries = [...block.props.entries];
                  entries[idx] = { ...entry, role: e.target.value };
                  onChange({ ...block, props: { ...block.props, entries } });
                }}
              />
              <Input
                placeholder="Organization"
                value={entry.organization}
                onChange={(e) => {
                  const entries = [...block.props.entries];
                  entries[idx] = { ...entry, organization: e.target.value };
                  onChange({ ...block, props: { ...block.props, entries } });
                }}
              />
              <Input
                placeholder="Period"
                value={entry.period}
                onChange={(e) => {
                  const entries = [...block.props.entries];
                  entries[idx] = { ...entry, period: e.target.value };
                  onChange({ ...block, props: { ...block.props, entries } });
                }}
              />
              <FieldTextarea
                placeholder="Bullets (one per line)"
                className="min-h-[80px]"
                value={entry.bullets.join("\n")}
                onChange={(e) => {
                  const entries = [...block.props.entries];
                  entries[idx] = {
                    ...entry,
                    bullets: e.target.value.split("\n"),
                  };
                  onChange({ ...block, props: { ...block.props, entries } });
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  entries: [
                    ...block.props.entries,
                    {
                      role: "",
                      organization: "",
                      period: "",
                      bullets: [""],
                    },
                  ],
                },
              })
            }
          >
            Add entry
          </Button>
        </div>
      );
    case "certifications":
      return (
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-navy/70">
            Section title
            <Input
              className="mt-1"
              value={block.props.title}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value },
                })
              }
            />
          </label>
          {block.props.items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-navy/10 bg-cream/50 p-3 space-y-2"
            >
              <Input
                placeholder="Certificate name"
                value={item.name}
                onChange={(e) => {
                  const items = [...block.props.items];
                  items[idx] = { ...item, name: e.target.value };
                  onChange({ ...block, props: { ...block.props, items } });
                }}
              />
              <Input
                placeholder="Issuer"
                value={item.issuer}
                onChange={(e) => {
                  const items = [...block.props.items];
                  items[idx] = { ...item, issuer: e.target.value };
                  onChange({ ...block, props: { ...block.props, items } });
                }}
              />
              <Input
                placeholder="Year"
                value={item.year}
                onChange={(e) => {
                  const items = [...block.props.items];
                  items[idx] = { ...item, year: e.target.value };
                  onChange({ ...block, props: { ...block.props, items } });
                }}
              />
              <Input
                placeholder="Verify link (optional)"
                value={item.link}
                onChange={(e) => {
                  const items = [...block.props.items];
                  items[idx] = { ...item, link: e.target.value };
                  onChange({ ...block, props: { ...block.props, items } });
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  items: [
                    ...block.props.items,
                    { name: "", issuer: "", year: "", link: "" },
                  ],
                },
              })
            }
          >
            Add certificate
          </Button>
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreviewUrl}
              alt=""
              className="max-h-40 rounded-xl object-cover"
            />
          ) : null}
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploadPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(block.id, file);
            }}
          />
          {uploadPending ? (
            <p className="text-xs text-muted">{portfolioCopy.imageOptimizing}</p>
          ) : null}
          <Input
            placeholder="Caption"
            value={block.props.caption}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, caption: e.target.value },
              })
            }
          />
          <Input
            placeholder="Alt text"
            value={block.props.alt}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, alt: e.target.value },
              })
            }
          />
        </div>
      );
    case "links":
      return (
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-navy/70">
            Section title
            <Input
              className="mt-1"
              value={block.props.title}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: e.target.value },
                })
              }
            />
          </label>
          {block.props.links.map((link, idx) => (
            <div key={idx} className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) => {
                  const links = [...block.props.links];
                  links[idx] = { ...link, label: e.target.value };
                  onChange({ ...block, props: { ...block.props, links } });
                }}
              />
              <Input
                placeholder="https://"
                value={link.url}
                onChange={(e) => {
                  const links = [...block.props.links];
                  links[idx] = { ...link, url: e.target.value };
                  onChange({ ...block, props: { ...block.props, links } });
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  links: [...block.props.links, { label: "", url: "" }],
                },
              })
            }
          >
            Add link
          </Button>
        </div>
      );
    case "divider":
      return (
        <p className="text-sm text-muted">{portfolioCopy.dividerHint}</p>
      );
    default:
      return null;
  }
}
