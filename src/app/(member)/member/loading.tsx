function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-sand/80 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function MemberLoading() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-md" />
      </div>
      <SkeletonBlock className="h-36 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </div>
    </div>
  );
}
