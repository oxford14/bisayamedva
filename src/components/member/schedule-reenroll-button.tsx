import Link from "next/link";
import { Button } from "@/components/ui/button";
import { courseCheckoutWithSession } from "@/lib/member/open-sessions-shared";
export function ScheduleReenrollButton({
  courseSlug,
  sessionId,
  label,
}: {
  courseSlug: string;
  sessionId: string;
  label: string;
}) {
  if (!courseSlug) return null;

  return (
    <Button variant="accent" className="mt-6 w-full sm:w-auto" asChild>
      <Link href={courseCheckoutWithSession(courseSlug, sessionId)}>
        {label}
      </Link>
    </Button>
  );
}
