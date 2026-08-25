"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell } from "lucide-react";
import { markLoungeNotificationsRead } from "@/app/(member)/member/lounge-actions";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
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

export function LoungeNotifications({
  items,
  unreadCount,
}: {
  items: LoungeNotification[];
  unreadCount: number;
}) {
  const [pending, start] = useTransition();

  return (
    <MemberCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex size-9 items-center justify-center rounded-xl bg-sand text-navy">
            <Bell className="size-4" aria-hidden />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-cream">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <p className="text-[11px] text-muted">
              Comments, reactions, and mentions
            </p>
          </div>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await markLoungeNotificationsRead();
              });
            }}
          >
            Mark read
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Wala pa kay notifications. Mag-post or mag-comment para magsugod ang
          conversation.
        </p>
      ) : (
        <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={
                  item.post_id
                    ? `/member/lounge?post=${item.post_id}`
                    : "/member/lounge"
                }
                className={cn(
                  "block rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-sand",
                  !item.read_at && "bg-cream",
                )}
              >
                <p className="text-ink">
                  <span className="font-semibold">{item.actor.full_name}</span>{" "}
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
    </MemberCard>
  );
}
