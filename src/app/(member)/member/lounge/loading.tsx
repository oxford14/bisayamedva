function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-sand/80 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function LoungeLoading() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-lg" />
      </div>
      <SkeletonBlock className="h-28 w-full" />
      <SkeletonBlock className="h-52 w-full" />
      <SkeletonBlock className="h-52 w-full" />
    </div>
  );
}
