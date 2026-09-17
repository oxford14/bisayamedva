"use client";

import { useState } from "react";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import type {
  MockCallScheduleFixture,
  MockCallScheduleWeekday,
} from "@/lib/practice/mock-call/tool-config";
import { cn } from "@/lib/utils";

export type SelectedScheduleSlot = {
  weekday: MockCallScheduleWeekday;
  time: string;
};

type Props = {
  fixture: MockCallScheduleFixture;
  selectedSlot: SelectedScheduleSlot | null;
  slotStepDone: boolean;
  nextClickId: string | null;
  onSelectOfferSlot: (slot: SelectedScheduleSlot) => void;
  onDecoy: () => void;
};

function slotKey(weekday: MockCallScheduleWeekday, time: string) {
  return `${weekday}:${time}`;
}

export function PmScheduleWeekView({
  fixture,
  selectedSlot,
  slotStepDone,
  nextClickId,
  onSelectOfferSlot,
  onDecoy,
}: Props) {
  const [activeDay, setActiveDay] = useState<MockCallScheduleWeekday>(
    fixture.focusWeekday,
  );

  const daySlots = fixture.slots.filter((s) => s.weekday === activeDay);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-navy/60">{fixture.weekLabel}</p>
      <div className="flex gap-1">
        {fixture.days.map((day) => {
          const hasOffer = fixture.slots.some(
            (s) => s.weekday === day && s.offerSlot,
          );
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={cn(
                "flex-1 rounded-md border px-1 py-1.5 text-center text-[10px] font-semibold transition-colors",
                activeDay === day
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-white text-navy/70 hover:bg-sand/40",
                day === fixture.focusWeekday &&
                  activeDay !== day &&
                  "ring-1 ring-teal-bright/40",
              )}
            >
              {day}
              {hasOffer ? (
                <span
                  className={cn(
                    "mt-0.5 block text-[9px] font-normal",
                    activeDay === day ? "text-white/80" : "text-teal-bright/90",
                  )}
                >
                  Open
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-border bg-white p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/50">
          {activeDay} — time slots
        </p>
        {daySlots.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No slots listed for this day.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {daySlots.map((cell) => {
              const key = slotKey(cell.weekday, cell.time);
              const isSelected =
                selectedSlot?.weekday === cell.weekday &&
                selectedSlot?.time === cell.time;
              const isDone = slotStepDone && isSelected;
              const isOpen = cell.status === "open";

              return (
                <PmClickable
                  key={key}
                  variant="button"
                  done={isDone}
                  className={cn(
                    "min-w-[4.5rem] text-center text-[11px]",
                    !isOpen && "cursor-not-allowed opacity-60",
                    isSelected && !isDone && "border-navy ring-1 ring-navy/30",
                  )}
                  onClick={() => {
                    if (!isOpen) {
                      onDecoy();
                      return;
                    }
                    if (cell.offerSlot && nextClickId === "selectSlot") {
                      onSelectOfferSlot({
                        weekday: cell.weekday,
                        time: cell.time,
                      });
                      return;
                    }
                    if (cell.offerSlot && slotStepDone) {
                      onSelectOfferSlot({
                        weekday: cell.weekday,
                        time: cell.time,
                      });
                      return;
                    }
                    if (isOpen && !cell.offerSlot) {
                      onDecoy();
                      return;
                    }
                    onDecoy();
                  }}
                >
                  {cell.time}
                  <span className="block text-[10px] font-normal text-muted">
                    {cell.offerSlot ? "Open — offer" : isOpen ? "Open" : "Booked"}
                  </span>
                </PmClickable>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
