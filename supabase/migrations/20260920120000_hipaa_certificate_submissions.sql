-- External HIPAA certificate upload + admin review (Medical VA Masterclass gate)

create type public.hipaa_submission_status as enum ('PENDING', 'APPROVED', 'REJECTED');

create table public.hipaa_certificate_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  status public.hipaa_submission_status not null default 'PENDING',
  review_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hipaa_submissions_one_per_student_course unique (student_id, course_id)
);

create index hipaa_submissions_status_idx
  on public.hipaa_certificate_submissions (status, submitted_at desc);

create index hipaa_submissions_course_idx
  on public.hipaa_certificate_submissions (course_id, submitted_at desc);

drop trigger if exists hipaa_certificate_submissions_set_updated_at
  on public.hipaa_certificate_submissions;
create trigger hipaa_certificate_submissions_set_updated_at
before update on public.hipaa_certificate_submissions
for each row execute function public.set_updated_at();

alter table public.hipaa_certificate_submissions enable row level security;

create policy hipaa_submissions_admin_all
  on public.hipaa_certificate_submissions for all
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy hipaa_submissions_student_select
  on public.hipaa_certificate_submissions for select
  to authenticated
  using (student_id = auth.uid());

create policy hipaa_submissions_student_insert
  on public.hipaa_certificate_submissions for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and public.student_enrolled_in_course(course_id)
  );

create policy hipaa_submissions_student_update
  on public.hipaa_certificate_submissions for update
  to authenticated
  using (
    student_id = auth.uid()
    and status in ('PENDING', 'REJECTED')
  )
  with check (
    student_id = auth.uid()
    and status = 'PENDING'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hipaa-certificates',
  'hipaa-certificates',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
