-- Recurring weekend live session (free for every logged-in student).
-- Single row: admins set day/time/Zoom link once; it repeats weekly.

create table if not exists public.live_session_schedule (
  id boolean primary key default true check (id),
  title text not null default 'Weekend Live Session',
  weekday smallint not null default 0 check (weekday between 0 and 6),
  start_time time not null default '19:00',
  end_time time not null default '21:00',
  timezone text not null default 'Asia/Manila',
  format text not null default 'Online',
  meeting_url text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint live_session_schedule_time_order check (end_time > start_time)
);

alter table public.live_session_schedule enable row level security;

drop policy if exists live_session_schedule_member_select on public.live_session_schedule;
create policy live_session_schedule_member_select
  on public.live_session_schedule for select
  to authenticated
  using (true);

drop policy if exists live_session_schedule_admin_insert on public.live_session_schedule;
create policy live_session_schedule_admin_insert
  on public.live_session_schedule for insert
  to authenticated
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

drop policy if exists live_session_schedule_admin_update on public.live_session_schedule;
create policy live_session_schedule_admin_update
  on public.live_session_schedule for update
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

-- Seed from the currently featured session's Zoom link when available.
insert into public.live_session_schedule (id, meeting_url)
values (
  true,
  (
    select s.meeting_url
    from public.site_settings ss
    join public.sessions s on s.id::text = trim(both '"' from ss.value::text)
    where ss.key = 'next_session_id'
    limit 1
  )
)
on conflict (id) do nothing;
