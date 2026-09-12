-- Targeted announcement audiences + optional email metadata

create type public.announcement_audience as enum ('ALL', 'SESSION', 'INDIVIDUAL');

alter table public.member_announcements
  add column audience_type public.announcement_audience not null default 'ALL',
  add column send_email boolean not null default false,
  add column email_sent_at timestamptz null;

create table public.member_announcement_sessions (
  announcement_id uuid not null references public.member_announcements (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  primary key (announcement_id, session_id)
);

create index member_announcement_sessions_session_idx
  on public.member_announcement_sessions (session_id);

create table public.member_announcement_recipients (
  announcement_id uuid not null references public.member_announcements (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create index member_announcement_recipients_user_idx
  on public.member_announcement_recipients (user_id, created_at desc);

alter table public.member_announcement_sessions enable row level security;
alter table public.member_announcement_recipients enable row level security;

drop policy if exists member_announcements_member_select on public.member_announcements;

create policy member_announcements_member_select
  on public.member_announcements for select
  to authenticated
  using (
    published = true
    and public.current_user_role() in ('STUDENT', 'ADMIN', 'SUPER_ADMIN')
    and exists (
      select 1
      from public.member_announcement_recipients r
      where r.announcement_id = member_announcements.id
        and r.user_id = auth.uid()
    )
  );

create policy member_announcement_recipients_select
  on public.member_announcement_recipients for select
  to authenticated
  using (user_id = auth.uid());

-- Backfill: existing published announcements → all ACTIVE/COMPLETED students
insert into public.member_announcement_recipients (announcement_id, user_id)
select distinct a.id, e.student_id
from public.member_announcements a
cross join public.enrollments e
where a.published = true
  and e.status in ('ACTIVE', 'COMPLETED')
on conflict (announcement_id, user_id) do nothing;
