-- Module 7 Practical Training + practical exam attempts (Medical VA Masterclass)

do $$
begin
  alter type public.course_module_item_kind add value 'PRACTICAL';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.practical_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  score integer not null check (score >= 0),
  max_score integer not null default 100 check (max_score > 0),
  passed boolean not null default false,
  critical_error boolean not null default false,
  section_scores jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists practical_exam_attempts_student_module_idx
  on public.practical_exam_attempts (student_id, module_id, submitted_at desc);

alter table public.practical_exam_attempts enable row level security;

drop policy if exists practical_exam_attempts_admin_select on public.practical_exam_attempts;
create policy practical_exam_attempts_admin_select
  on public.practical_exam_attempts for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

drop policy if exists practical_exam_attempts_student_select on public.practical_exam_attempts;
create policy practical_exam_attempts_student_select
  on public.practical_exam_attempts for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists practical_exam_attempts_student_insert on public.practical_exam_attempts;
create policy practical_exam_attempts_student_insert
  on public.practical_exam_attempts for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.course_modules m
      where m.id = practical_exam_attempts.module_id
        and m.status = 'PUBLISHED'
        and public.student_can_open_course_modules(m.course_id)
    )
    and exists (
      select 1
      from public.enrollments e
      where e.id = practical_exam_attempts.enrollment_id
        and e.student_id = auth.uid()
    )
  );

-- Insert Module 7 before Module 8 (sort_order >= 7 bumped by 1)
do $$
declare
  v_course_id uuid;
  v_has_mod7 boolean;
begin
  select id into v_course_id from public.courses where slug = 'medical-va-masterclass' limit 1;
  if v_course_id is null then
    return;
  end if;

  select exists (
    select 1 from public.course_modules
    where course_id = v_course_id and title ~* '\mModule 7\M'
  ) into v_has_mod7;

  if v_has_mod7 then
    return;
  end if;

  update public.course_modules
  set sort_order = sort_order + 1
  where course_id = v_course_id and sort_order >= 7;

  insert into public.course_modules (course_id, title, description, status, sort_order)
  values (
    v_course_id,
    'Module 7 – Practical Training',
    'Practice Lab skills and Practical Exam — from learning to doing.',
    'PUBLISHED',
    7
  );
end $$;
