import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const sectionPad = "w-full py-20 sm:py-24 lg:py-32";
export const displayTitle =
  "font-display font-semibold tracking-tight text-balance text-[clamp(1.85rem,4.2vw,3.75rem)] leading-[1.12]";
