-- Modules open for ACTIVE/COMPLETED enrollments; session start is not required.

create or replace function public.student_can_open_course_modules(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.student_enrolled_in_course(p_course_id);
$$;
