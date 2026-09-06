-- Staff can open Student Lounge without an enrollment.
create or replace function public.can_access_student_lounge()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    public.current_user_role() in ('ADMIN', 'SUPER_ADMIN')
    or exists (
      select 1
      from public.enrollments e
      where e.student_id = auth.uid()
        and e.status in ('ACTIVE', 'COMPLETED')
    )
    or exists (
      select 1
      from public.enrollments e
      join public.payments p on p.enrollment_id = e.id
      where e.student_id = auth.uid()
        and p.status = 'PAID'
    ),
    false
  );
$$;
