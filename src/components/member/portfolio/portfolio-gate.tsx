import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MemberEmptyState } from "@/components/member/ui";
import { portfolioCopy } from "@/content/site";

export function PortfolioGate() {
  return (
    <MemberEmptyState
      title={portfolioCopy.gateTitle}
      body={portfolioCopy.gateBody}
      action={
        <Button variant="accent" asChild>
          <Link href="/member/course">{portfolioCopy.gateCta}</Link>
        </Button>
      }
    />
  );
}
