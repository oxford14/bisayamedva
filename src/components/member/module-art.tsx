import Image from "next/image";
import { Lock, Unlock } from "lucide-react";
import { getModuleArt } from "@/content/module-art";
import { modulesCopy } from "@/content/site";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  card: "h-40",
  hero: "h-44 sm:h-52 md:h-full min-h-44",
  thumb: "size-14",
  locked: "h-36 w-full max-w-xs",
} as const;

const SIZE_SIZES = {
  card: "(max-width: 768px) 100vw, 50vw",
  hero: "(max-width: 768px) 100vw, 40vw",
  thumb: "56px",
  locked: "(max-width: 768px) 80vw, 320px",
} as const;

export function ModuleArt({
  slug,
  size = "card",
  className,
  priority = false,
}: {
  slug: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  priority?: boolean;
}) {
  const art = getModuleArt(slug);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-sand",
        SIZE_CLASS[size],
        className,
      )}
    >
      <Image
        src={art.src}
        alt={art.alt}
        fill
        sizes={SIZE_SIZES[size]}
        priority={priority}
        className="object-cover object-center"
      />
    </div>
  );
}

export function ModuleAccessBadge({ unlocked }: { unlocked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        unlocked ? "bg-teal-bright/25 text-navy" : "bg-sand text-navy/80",
      )}
    >
      {unlocked ? (
        <Unlock className="size-3" aria-hidden />
      ) : (
        <Lock className="size-3" aria-hidden />
      )}
      {unlocked ? modulesCopy.openBadge : modulesCopy.lockedBadge}
    </span>
  );
}