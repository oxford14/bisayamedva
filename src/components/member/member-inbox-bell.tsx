"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import {
  fetchMemberInbox,
  markAnnouncementReadInbox,
  markLoungeNotificationsReadInbox,
} from "@/app/(member)/member/inbox-actions";
import {
  AnnouncementDetailDialog,
  type AnnouncementDetail,
} from "@/components/member/announcement-detail-dialog";
import { Button } from "@/components/ui/button";
import { inboxCopy } from "@/content/site";
import type { MemberInboxSnapshot } from "@/lib/member/inbox";
import type { LoungeNotification } from "@/lib/member/lounge";
import { cn } from "@/lib/utils";

function labelFor(n: LoungeNotification) {
  switch (n.type) {
    case "COMMENT":
      return "commented on your post";
    case "REPLY":
      return "replied to your comment";
    case "REACTION":
      return "reacted to your post";
    case "MENTION":
      return "mentioned you";
    default:
      return "sent an update";
  }
}

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

type Tab = "notifications" | "announcements";

export function MemberInboxBell({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("announcements");
  const [snapshot, setSnapshot] = useState<MemberInboxSnapshot | null>(null);
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pending, start] = useTransition();

  const badge = snapshot?.badgeTotal ?? 0;

  function loadInbox() {
    start(async () => {
      const result = await fetchMemberInbox();
      if (result.ok) setSnapshot(result.snapshot);
    });
  }

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role]);

  useEffect(() => {
    if (!open) return;
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  function openAnnouncement(item: {
    id: string;
    title: string;
    body: string;
    created_at: string;
  }) {
    setDetail({
      title: item.title,
      body: item.body,
      created_at: item.created_at,
    });
    setDetailOpen(true);
    setOpen(false);
    start(async () => {
      await markAnnouncementReadInbox(item.id);
      loadInbox();
    });
  }

  function markLoungeRead() {
    start(async () => {
      await markLoungeNotificationsReadInbox();
      loadInbox();
    });
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-navy/10 bg-white text-navy outline-none transition-colors hover:bg-sand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-label={inboxCopy.bellLabel}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <Bell className="size-[1.15rem]" aria-hidden />
          {badge > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-navy px-1 py-0.5 text-[10px] font-bold text-cream">
              {badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </button>

        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-label={inboxCopy.bellLabel}
            className="absolute top-[calc(100%+0.5rem)] right-0 z-50 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_40px_rgba(47,56,38,0.16)]"
          >
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setTab("notifications")}
                className={cn(
                  "flex-1 px-3 py-3 text-xs font-semibold tracking-wide uppercase transition-colors",
                  tab === "notifications"
                    ? "border-b-2 border-navy text-navy"
                    : "text-muted hover:text-ink",
                )}
              >
                {inboxCopy.tabNotifications}
                {(snapshot?.loungeUnread ?? 0) > 0 ? (
                  <span className="ml-1 text-teal">
                    ({snapshot?.loungeUnread})
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setTab("announcements")}
                className={cn(
                  "flex-1 px-3 py-3 text-xs font-semibold tracking-wide uppercase transition-colors",
                  tab === "announcements"
                    ? "border-b-2 border-navy text-navy"
                    : "text-muted hover:text-ink",
                )}
              >
                {inboxCopy.tabAnnouncements}
                {(snapshot?.announcementUnread ?? 0) > 0 ? (
                  <span className="ml-1 text-teal">
                    ({snapshot?.announcementUnread})
                  </span>
                ) : null}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {pending && !snapshot ? (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  Loading…
                </p>
              ) : tab === "notifications" ? (
                <>
                  {(snapshot?.loungeUnread ?? 0) > 0 ? (
                    <div className="mb-2 flex justify-end px-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={markLoungeRead}
                      >
                        {inboxCopy.markRead}
                      </Button>
                    </div>
                  ) : null}
                  {!snapshot?.notifications.length ? (
                    <p className="px-2 py-4 text-sm text-muted">
                      {inboxCopy.notificationsEmpty}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {snapshot.notifications.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={
                              item.post_id
                                ? `/member/lounge?post=${item.post_id}`
                                : "/member/lounge"
                            }
                            onClick={() => setOpen(false)}
                            className={cn(
                              "block rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-sand",
                              !item.read_at && "bg-cream",
                            )}
                          >
                            <p className="text-ink">
                              <span className="font-semibold">
                                {item.actor.full_name}
                              </span>{" "}
                              {labelFor(item)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                              {formatWhen(item.created_at)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : !snapshot?.announcements.length ? (
                <p className="px-2 py-4 text-sm text-muted">
                  {inboxCopy.announcementsEmpty}
                </p>
              ) : (
                <ul className="space-y-1">
                  {snapshot.announcements.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openAnnouncement(item)}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-sand",
                          !item.read && "bg-cream",
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
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted">
                          {item.body}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {formatWhen(item.created_at)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <AnnouncementDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        announcement={detail}
      />
    </>
  );
}
