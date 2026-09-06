"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/member/ui";
import { referCopy } from "@/content/site";

export function ReferLinkCard({
  code,
  link,
}: {
  code: string;
  link: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <MemberCard>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
        {referCopy.codeLabel}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-wide text-ink">
        {code}
      </p>
      <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
        {referCopy.linkLabel}
      </p>
      <p className="mt-1 break-all text-sm text-muted">{link}</p>
      <Button
        type="button"
        variant="accent"
        className="mt-4"
        onClick={copyLink}
      >
        <Copy className="size-4" aria-hidden />
        {copied ? referCopy.copied : referCopy.copyLink}
      </Button>
    </MemberCard>
  );
}