import { cn } from "@/lib/utils";

// Classic EKG rhythm: flat → small P wave → sharp QRS spike → T wave → flat.
const EKG_PATH =
  "M2 32 H46 L56 32 L62 23 L70 41 L79 6 L88 48 L95 32 H126 Q135 21 144 32 H218";

type PageLoaderProps = {
  compact?: boolean;
  className?: string;
};

export function PageLoader({ compact = false, className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        compact ? "py-10" : "min-h-[55vh] py-16",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-teal">
        <svg
          viewBox="0 0 220 56"
          fill="none"
          className={compact ? "h-10 w-40" : "h-14 w-56"}
          aria-hidden
        >
          <path
            d={EKG_PATH}
            stroke="currentColor"
            strokeOpacity={0.16}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={EKG_PATH}
            pathLength={1}
            className="ekg-trace"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "animate-heartbeat shrink-0 fill-teal",
            compact ? "h-5 w-5" : "h-7 w-7",
          )}
          aria-hidden
        >
          <path d="M12 3a9 9 0 0 0-9 9v6.5A2.5 2.5 0 0 0 5.5 21H7a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5v-1a7 7 0 0 1 14 0v1h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1.5a2.5 2.5 0 0 0 2.5-2.5V12a9 9 0 0 0-9-9z" />
        </svg>
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
