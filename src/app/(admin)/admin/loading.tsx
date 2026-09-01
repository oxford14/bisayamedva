function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-sand/80 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </div>
      <SkeletonBlock className="h-64 w-full rounded-2xl" />
    </div>
  );
}
