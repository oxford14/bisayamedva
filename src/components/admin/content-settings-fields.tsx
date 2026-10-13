"use client";

import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import {
  WEEKDAY_LABELS,
  type LiveSessionSchedule,
} from "@/lib/live-session/schedule-shared";

export type ContentCourseOption = {
  id: string;
  title: string;
};

const selectClassName =
  "flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5";

export function ContentSettingsFields({
  courses,
  featuredCourseId,
  schedule,
}: {
  courses: ContentCourseOption[];
  featuredCourseId: string;
  schedule: LiveSessionSchedule;
}) {
  return (
    <div className="space-y-4">
      <Field label="Featured course" htmlFor="featured_course_id">
        <select
          id="featured_course_id"
          name="featured_course_id"
          defaultValue={featuredCourseId}
          className={selectClassName}
        >
          <option value="">Use site.ts fallback</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-ink">Weekend live session</p>
        <p className="mt-1 text-xs text-muted">
          Free for every student. Set once — repeats every week until you change it.
        </p>
      </div>
      <Field label="Session title" htmlFor="live_title">
        <Input
          id="live_title"
          name="live_title"
          defaultValue={schedule.title}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Day" htmlFor="live_weekday">
          <select
            id="live_weekday"
            name="live_weekday"
            defaultValue={String(schedule.weekday)}
            className={selectClassName}
          >
            {WEEKDAY_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start (PHT)" htmlFor="live_start_time">
          <Input
            id="live_start_time"
            name="live_start_time"
            type="time"
            defaultValue={schedule.start_time}
            required
          />
        </Field>
        <Field label="End (PHT)" htmlFor="live_end_time">
          <Input
            id="live_end_time"
            name="live_end_time"
            type="time"
            defaultValue={schedule.end_time}
            required
          />
        </Field>
      </div>
      <Field
        label="Meeting URL"
        htmlFor="live_meeting_url"
        hint="Zoom or Meet link. Students see it on their Schedule page every week."
      >
        <Input
          id="live_meeting_url"
          name="live_meeting_url"
          type="text"
          inputMode="url"
          placeholder="https://…"
          autoComplete="off"
          defaultValue={schedule.meeting_url ?? ""}
        />
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="live_is_active"
          defaultChecked={schedule.is_active}
          className="size-4 accent-[var(--color-teal,#5b6d49)]"
        />
        Live session is on (uncheck to pause, e.g. holidays)
      </label>
    </div>
  );
}
