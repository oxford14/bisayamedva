"use client";

import { useState, useTransition } from "react";
import { Megaphone } from "lucide-react";
import { markAnnouncementReadInbox } from "@/app/(member)/member/inbox-actions";
import {
  AnnouncementDetailDialog,
  type AnnouncementDetail,
} from "@/components/member/announcement-detail-dialog";
import { MemberCard } from "@/components/member/ui";
import { inboxCopy } from "@/content/site";
import type { MemberAnnouncementListItem } from "@/lib/member/announcements";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function MemberHomeUpdates({
  announcements,
}: {
  announcements: MemberAnnouncementListItem[];
}) {
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();

  function openItem(item: MemberAnnouncementListItem) {
    setDetail({
      title: item.title,
      body: item.body,
      created_at: item.created_at,
    });
    setOpen(true);
    start(async () => {
      await markAnnouncementReadInbox(item.id);
    });
  }

  return (
    <>
      <MemberCard className="mt-6">
        <div className="flex items-center gap-2 text-navy/60">
          <Megaphone className="size-4" aria-hidden />
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
            {inboxCopy.homeUpdatesTitle}
          </p>
        </div>
        {announcements.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{inboxCopy.homeUpdatesEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {announcements.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                    "w-full rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-sand",
                    !item.read && "border-navy/15 bg-cream/80",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    {!item.read ? (
                      <span className="shrink-0 rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold text-cream uppercase">
                        {inboxCopy.newBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    {formatWhen(item.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">{inboxCopy.homeUpdatesHint}</p>
      </MemberCard>

      <AnnouncementDetailDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setDetail(null);
        }}
        announcement={detail}
      />
    </>
  );
}
