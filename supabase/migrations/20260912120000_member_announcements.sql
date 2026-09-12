-- Member announcements (admin-authored, student inbox)

create table public.member_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(body) > 0),
  published boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index member_announcements_published_created_idx
  on public.member_announcements (published, created_at desc);

create table public.member_announcement_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  announcement_id uuid not null references public.member_announcements (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

create index member_announcement_reads_user_idx
  on public.member_announcement_reads (user_id, read_at desc);

alter table public.member_announcements enable row level security;
alter table public.member_announcement_reads enable row level security;

-- Students and staff previewing member app: read published announcements
create policy member_announcements_member_select
  on public.member_announcements for select
  to authenticated
  using (
    published = true
    and public.current_user_role() in ('STUDENT', 'ADMIN', 'SUPER_ADMIN')
  );

-- Admins: full read (including drafts)
create policy member_announcements_admin_select
  on public.member_announcements for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy member_announcements_admin_insert
  on public.member_announcements for insert
  to authenticated
  with check (
    public.current_user_role() in ('ADMIN', 'SUPER_ADMIN')
    and created_by = auth.uid()
  );

create policy member_announcements_admin_update
  on public.member_announcements for update
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy member_announcements_admin_delete
  on public.member_announcements for delete
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

-- Read receipts: own rows only
create policy member_announcement_reads_select
  on public.member_announcement_reads for select
  to authenticated
  using (user_id = auth.uid());

create policy member_announcement_reads_insert
  on public.member_announcement_reads for insert
  to authenticated
  with check (user_id = auth.uid());

create policy member_announcement_reads_update
  on public.member_announcement_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
