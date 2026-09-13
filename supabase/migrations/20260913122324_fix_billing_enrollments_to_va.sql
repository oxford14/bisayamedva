-- Medical VA Masterclass holds all published modules; billing enrollments were mis-assigned.
-- Stable catalog UUIDs from 20260826_training_program_catalog.sql

do $$
declare
  billing_id uuid := '11111111-1111-1111-1111-111111111111';
  va_id uuid := '11111111-1111-1111-1111-111111111112';
begin
  -- Students with both billing + VA: drop the stray billing row
  update public.enrollments e
  set status = 'CANCELLED'
  where e.course_id = billing_id
    and e.status in ('ACTIVE', 'COMPLETED', 'PENDING_PAYMENT')
    and exists (
      select 1
      from public.enrollments e2
      where e2.student_id = e.student_id
        and e2.course_id = va_id
        and e2.status in ('ACTIVE', 'COMPLETED', 'PENDING_PAYMENT')
        and e2.id <> e.id
    );

  -- Billing-only enrollments → Medical VA Masterclass
  update public.enrollments e
  set course_id = va_id
  where e.course_id = billing_id
    and e.status in ('ACTIVE', 'COMPLETED', 'PENDING_PAYMENT');
end $$;

-- Default featured course for register/checkout (VA, not billing)
insert into public.site_settings (key, value)
values ('featured_course_id', '"11111111-1111-1111-1111-111111111112"')
on conflict (key) do update set value = excluded.value;

-- VA first in BASIC fallback ordering
update public.courses
set sort_order = 10
where id = '11111111-1111-1111-1111-111111111112';

update public.courses
set sort_order = 11
where id = '11111111-1111-1111-1111-111111111111';
