import { practiceCopy } from "@/content/site";

export function PracticeDisclaimer() {
  return (
    <div
      className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-navy/90"
      role="note"
    >
      {practiceCopy.disclaimer}
    </div>
  );
}
