-- Soft-complete live sessions without archiving or cancelling enrollments.

alter table public.sessions
  add column if not exists completed_at timestamptz null;

create index if not exists sessions_completed_at_idx
  on public.sessions (completed_at desc)
  where completed_at is not null;
