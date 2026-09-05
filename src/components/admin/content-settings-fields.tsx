"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/forms/field";

export type ContentCourseOption = {
  id: string;
  title: string;
};

export type ContentSessionOption = {
  id: string;
  courseId: string;
  label: string;
};

const selectClassName =
  "flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5";

export function ContentSettingsFields({
  courses,
  sessions,
  featuredCourseId,
  nextSessionId,
}: {
  courses: ContentCourseOption[];
  sessions: ContentSessionOption[];
  featuredCourseId: string;
  nextSessionId: string;
}) {
  const [courseId, setCourseId] = useState(featuredCourseId);
  const [sessionId, setSessionId] = useState(nextSessionId);

  const visibleSessions = useMemo(() => {
    if (!courseId) return sessions;
    return sessions.filter((session) => session.courseId === courseId);
  }, [courseId, sessions]);

  function onCourseChange(nextCourseId: string) {
    setCourseId(nextCourseId);
    const stillValid = sessions.some(
      (session) =>
        session.id === sessionId &&
        (!nextCourseId || session.courseId === nextCourseId),
    );
    if (!stillValid) setSessionId("");
  }

  return (
    <div className="space-y-4">
      <Field label="Featured course" htmlFor="featured_course_id">
        <select
          id="featured_course_id"
          name="featured_course_id"
          value={courseId}
          onChange={(e) => onCourseChange(e.target.value)}
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
      <Field label="Next session" htmlFor="next_session_id">
        <select
          id="next_session_id"
          name="next_session_id"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className={selectClassName}
        >
          <option value="">Use site.ts fallback</option>
          {visibleSessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
