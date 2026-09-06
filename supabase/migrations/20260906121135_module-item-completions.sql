-- Item-level progress for Coursera-style sequential unlock

create type public.course_module_item_kind as enum ('FILE', 'QUIZ');

create table public.course_module_item_completions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  item_kind public.course_module_item_kind not null,
  item_id uuid not null,
  completed_at timestamptz not null default now(),
  constraint course_module_item_completions_unique
    unique (student_id, item_kind, item_id)
);

create index course_module_item_completions_student_idx
  on public.course_module_item_completions (student_id, completed_at desc);

create index course_module_item_completions_module_idx
  on public.course_module_item_completions (module_id);

alter table public.course_module_item_completions enable row level security;

create policy course_module_item_completions_admin_select
  on public.course_module_item_completions for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy course_module_item_completions_student_select
  on public.course_module_item_completions for select
  to authenticated
  using (student_id = auth.uid());

create policy course_module_item_completions_student_insert
  on public.course_module_item_completions for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.course_modules m
      where m.id = course_module_item_completions.module_id
        and m.status = 'PUBLISHED'
        and public.student_can_open_course_modules(m.course_id)
    )
  );
