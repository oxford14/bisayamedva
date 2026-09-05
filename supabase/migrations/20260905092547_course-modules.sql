-- Course modules LMS: curriculum, files, quizzes, attempts

create or replace function public.student_enrolled_in_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    exists (
      select 1
      from public.enrollments e
      where e.student_id = auth.uid()
        and e.course_id = p_course_id
        and e.status in ('ACTIVE', 'COMPLETED')
    ),
    false
  );
$$;

create or replace function public.student_can_open_course_modules(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    exists (
      select 1
      from public.enrollments e
      join public.sessions s on s.id = e.session_id
      where e.student_id = auth.uid()
        and e.course_id = p_course_id
        and e.status in ('ACTIVE', 'COMPLETED')
        and s.starts_at <= now()
    ),
    false
  );
$$;

revoke all on function public.student_enrolled_in_course(uuid) from public, anon;
revoke all on function public.student_can_open_course_modules(uuid) from public, anon;
grant execute on function public.student_enrolled_in_course(uuid) to authenticated;
grant execute on function public.student_can_open_course_modules(uuid) to authenticated;

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  status public.publish_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_modules_title_not_blank check (char_length(trim(title)) > 0)
);

create index course_modules_course_idx
  on public.course_modules (course_id, sort_order);

create table public.course_module_files (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index course_module_files_module_idx
  on public.course_module_files (module_id, sort_order);

create table public.course_module_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  prompt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint course_module_quiz_questions_prompt_not_blank
    check (char_length(trim(prompt)) > 0)
);

create index course_module_quiz_questions_module_idx
  on public.course_module_quiz_questions (module_id, sort_order);

create table public.course_module_quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.course_module_quiz_questions (id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  constraint course_module_quiz_options_label_not_blank
    check (char_length(trim(label)) > 0)
);

create index course_module_quiz_options_question_idx
  on public.course_module_quiz_options (question_id, sort_order);

create table public.course_module_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index course_module_quiz_attempts_student_idx
  on public.course_module_quiz_attempts (student_id, module_id, submitted_at desc);

drop trigger if exists course_modules_set_updated_at on public.course_modules;
create trigger course_modules_set_updated_at
before update on public.course_modules
for each row execute function public.set_updated_at();

alter table public.course_modules enable row level security;
alter table public.course_module_files enable row level security;
alter table public.course_module_quiz_questions enable row level security;
alter table public.course_module_quiz_options enable row level security;
alter table public.course_module_quiz_attempts enable row level security;

-- Modules: staff manage; enrolled students read published rows (lock state is app-level)
create policy course_modules_admin_all
  on public.course_modules for all
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy course_modules_student_select
  on public.course_modules for select
  to authenticated
  using (
    status = 'PUBLISHED'
    and public.student_enrolled_in_course(course_id)
  );

-- Files: staff manage; students can read metadata only after Zoom start
create policy course_module_files_admin_all
  on public.course_module_files for all
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy course_module_files_student_select
  on public.course_module_files for select
  to authenticated
  using (
    exists (
      select 1
      from public.course_modules m
      where m.id = course_module_files.module_id
        and m.status = 'PUBLISHED'
        and public.student_can_open_course_modules(m.course_id)
    )
  );

-- Quiz content is staff-only over the Data API. Students load questions
-- (without is_correct) through server actions after the unlock check.
create policy course_module_quiz_questions_admin_all
  on public.course_module_quiz_questions for all
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy course_module_quiz_options_admin_all
  on public.course_module_quiz_options for all
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

-- Attempts: students write/read their own; staff can read all
create policy course_module_quiz_attempts_admin_select
  on public.course_module_quiz_attempts for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy course_module_quiz_attempts_student_select
  on public.course_module_quiz_attempts for select
  to authenticated
  using (student_id = auth.uid());

create policy course_module_quiz_attempts_student_insert
  on public.course_module_quiz_attempts for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.course_modules m
      where m.id = course_module_quiz_attempts.module_id
        and m.status = 'PUBLISHED'
        and public.student_can_open_course_modules(m.course_id)
    )
    and exists (
      select 1
      from public.enrollments e
      where e.id = course_module_quiz_attempts.enrollment_id
        and e.student_id = auth.uid()
        and e.status in ('ACTIVE', 'COMPLETED')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-modules',
  'course-modules',
  false,
  104857600,
  array[
    'application/pdf',
    'video/mp4',
    'video/webm',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bytes stay behind signed URLs from the service role. No authenticated
-- storage policies — students and admins never list this bucket directly.
