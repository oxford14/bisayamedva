"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberStatusBadge } from "@/components/member/ui";
import { referCopy, walletCopy } from "@/content/site";
import { formatPeso } from "@/lib/utils";
import type {
  ReferralFriend,
  ReferralRewardRow,
} from "@/lib/referrals/data";

export function ReferralFriendsList({
  rewards,
  friends,
}: {
  rewards: ReferralRewardRow[];
  friends: ReferralFriend[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const friend = friends.find((item) => item.id === openId) ?? null;

  return (
    <>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/60 text-[11px] font-semibold tracking-wide text-navy/70 uppercase">
            <tr>
              <th className="px-4 py-3">{referCopy.friend}</th>
              <th className="px-4 py-3">{referCopy.course}</th>
              <th className="px-4 py-3">{referCopy.commission}</th>
              <th className="px-4 py-3">{referCopy.date}</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-ink">
                  <button
                    type="button"
                    className="cursor-pointer text-left font-medium text-teal underline-offset-2 hover:text-navy hover:underline"
                    onClick={() => setOpenId(row.refereeId)}
                  >
                    {row.friendName}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted">{row.courseTitle}</td>
                <td className="px-4 py-3 text-navy">{formatPeso(row.amount)}</td>
                <td className="px-4 py-3 text-muted">
                  {new Intl.DateTimeFormat("en-PH", {
                    dateStyle: "medium",
                  }).format(new Date(row.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ReferralCoursesSheet
        friend={friend}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

function ReferralCoursesSheet({
  friend,
  onClose,
}: {
  friend: ReferralFriend | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const open = Boolean(friend);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!friend) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-white shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            {referCopy.friendCourses}
          </p>
          <h2
            id={titleId}
            className="mt-1 font-display text-xl font-semibold text-ink"
          >
            {friend.name}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {friend.courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {referCopy.noFriendCourses}
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {friend.courses.map((course, index) => (
                <li
                  key={`${course.title}-${index}`}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <p className="text-sm font-medium text-ink">{course.title}</p>
                  <MemberStatusBadge status={course.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            {walletCopy.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
