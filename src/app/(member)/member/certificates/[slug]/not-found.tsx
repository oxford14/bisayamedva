import Link from "next/link";
import { MemberEmptyState, MemberPageHeader } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { certificatesCopy } from "@/content/site";

export default function CertificateNotFound() {
  return (
    <div>
      <MemberPageHeader
        title={certificatesCopy.title}
        description={certificatesCopy.description}
      />
      <MemberEmptyState
        title={certificatesCopy.emptyTitle}
        body={certificatesCopy.emptyBody}
        action={
          <Button variant="accent" asChild>
            <Link href="/member/modules">{certificatesCopy.emptyCta}</Link>
          </Button>
        }
      />
    </div>
  );
}
