-- Pay for a course first; attach a weekend session later.

alter table public.enrollments
  alter column session_id drop not null;

alter table public.enrollments
  drop constraint if exists enrollments_student_id_session_id_key;

create unique index if not exists enrollments_student_course_unique
  on public.enrollments (student_id, course_id);

create unique index if not exists enrollments_student_session_unique
  on public.enrollments (student_id, session_id)
  where session_id is not null;
