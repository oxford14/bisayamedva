import Link from "next/link";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { MemberEmptyState } from "@/components/member/ui";

export function PracticeGate({ previewOnly = false }: { previewOnly?: boolean }) {
  if (previewOnly) {
    return (
      <MemberEmptyState
        title={practiceCopy.gatePreviewTitle}
        body={practiceCopy.gatePreviewBody}
        action={
          <Button variant="accent" asChild>
            <Link href="/member">{practiceCopy.gatePreviewCta}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <MemberEmptyState
      title={practiceCopy.gateTitle}
      body={practiceCopy.gateBody}
      action={
        <Button variant="accent" asChild>
          <Link href="/member/course">{practiceCopy.gateCta}</Link>
        </Button>
      }
    />
  );
}
