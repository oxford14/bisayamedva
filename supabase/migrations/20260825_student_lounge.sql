-- Student Lounge: community feed for Active / Paid students

create type public.lounge_reaction as enum ('LIKE', 'CELEBRATE', 'HELPFUL');

create type public.lounge_notification_type as enum (
  'COMMENT',
  'REPLY',
  'REACTION',
  'MENTION'
);

create or replace function public.can_access_student_lounge()
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

revoke all on function public.can_access_student_lounge() from public;
grant execute on function public.can_access_student_lounge() to authenticated;

create table public.lounge_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index lounge_posts_feed_idx
  on public.lounge_posts (created_at desc)
  where deleted_at is null;

create index lounge_posts_author_idx on public.lounge_posts (author_id);

create table public.lounge_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lounge_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.lounge_comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint lounge_comments_body_not_blank check (char_length(trim(body)) > 0)
);

create index lounge_comments_post_idx
  on public.lounge_comments (post_id, created_at)
  where deleted_at is null;

create table public.lounge_reactions (
  post_id uuid not null references public.lounge_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction public.lounge_reaction not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.lounge_mentions (
  id uuid primary key default gen_random_uuid(),
  mentioned_user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.lounge_posts (id) on delete cascade,
  comment_id uuid references public.lounge_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint lounge_mentions_target check (post_id is not null or comment_id is not null)
);

create table public.lounge_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type public.lounge_notification_type not null,
  post_id uuid references public.lounge_posts (id) on delete cascade,
  comment_id uuid references public.lounge_comments (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index lounge_notifications_user_idx
  on public.lounge_notifications (user_id, created_at desc);

-- updated_at triggers (uses existing public.set_updated_at)
drop trigger if exists lounge_posts_set_updated_at on public.lounge_posts;
create trigger lounge_posts_set_updated_at
before update on public.lounge_posts
for each row execute function public.set_updated_at();

drop trigger if exists lounge_comments_set_updated_at on public.lounge_comments;
create trigger lounge_comments_set_updated_at
before update on public.lounge_comments
for each row execute function public.set_updated_at();

-- RLS
alter table public.lounge_posts enable row level security;
alter table public.lounge_comments enable row level security;
alter table public.lounge_reactions enable row level security;
alter table public.lounge_mentions enable row level security;
alter table public.lounge_notifications enable row level security;

-- Posts
create policy "lounge_posts_select"
on public.lounge_posts for select to authenticated
using (
  public.can_access_student_lounge()
  and deleted_at is null
);

create policy "lounge_posts_insert"
on public.lounge_posts for insert to authenticated
with check (
  public.can_access_student_lounge()
  and author_id = auth.uid()
);

create policy "lounge_posts_update"
on public.lounge_posts for update to authenticated
using (
  public.can_access_student_lounge()
  and author_id = auth.uid()
)
with check (
  public.can_access_student_lounge()
  and author_id = auth.uid()
);

create policy "lounge_posts_delete"
on public.lounge_posts for delete to authenticated
using (
  public.can_access_student_lounge()
  and author_id = auth.uid()
);

-- Comments
create policy "lounge_comments_select"
on public.lounge_comments for select to authenticated
using (
  public.can_access_student_lounge()
  and deleted_at is null
);

create policy "lounge_comments_insert"
on public.lounge_comments for insert to authenticated
with check (
  public.can_access_student_lounge()
  and author_id = auth.uid()
);

create policy "lounge_comments_update"
on public.lounge_comments for update to authenticated
using (
  public.can_access_student_lounge()
  and author_id = auth.uid()
)
with check (
  public.can_access_student_lounge()
  and author_id = auth.uid()
);

create policy "lounge_comments_delete"
on public.lounge_comments for delete to authenticated
using (
  public.can_access_student_lounge()
  and author_id = auth.uid()
);

-- Reactions
create policy "lounge_reactions_select"
on public.lounge_reactions for select to authenticated
using (public.can_access_student_lounge());

create policy "lounge_reactions_insert"
on public.lounge_reactions for insert to authenticated
with check (
  public.can_access_student_lounge()
  and user_id = auth.uid()
);

create policy "lounge_reactions_update"
on public.lounge_reactions for update to authenticated
using (
  public.can_access_student_lounge()
  and user_id = auth.uid()
)
with check (
  public.can_access_student_lounge()
  and user_id = auth.uid()
);

create policy "lounge_reactions_delete"
on public.lounge_reactions for delete to authenticated
using (
  public.can_access_student_lounge()
  and user_id = auth.uid()
);

-- Mentions
create policy "lounge_mentions_select"
on public.lounge_mentions for select to authenticated
using (
  public.can_access_student_lounge()
  and (mentioned_user_id = auth.uid() or actor_id = auth.uid())
);

create policy "lounge_mentions_insert"
on public.lounge_mentions for insert to authenticated
with check (
  public.can_access_student_lounge()
  and actor_id = auth.uid()
);

-- Notifications
create policy "lounge_notifications_select"
on public.lounge_notifications for select to authenticated
using (user_id = auth.uid());

create policy "lounge_notifications_insert"
on public.lounge_notifications for insert to authenticated
with check (
  public.can_access_student_lounge()
  and actor_id = auth.uid()
);

create policy "lounge_notifications_update"
on public.lounge_notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Classmate profile reads for feed + @mentions
drop policy if exists "Students can read classmate profiles" on public.profiles;
create policy "Students can read classmate profiles"
on public.profiles for select to authenticated
using (
  role = 'STUDENT'
  and public.current_user_role() = 'STUDENT'
);

-- Private lounge images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lounge-images',
  'lounge-images',
  false,
  2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lounge_images_select_own" on storage.objects;
drop policy if exists "lounge_images_insert_own" on storage.objects;
drop policy if exists "lounge_images_update_own" on storage.objects;
drop policy if exists "lounge_images_delete_own" on storage.objects;

-- Owners manage their folder; signed URLs used for classmates
create policy "lounge_images_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'lounge-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "lounge_images_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lounge-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and public.can_access_student_lounge()
);

create policy "lounge_images_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'lounge-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'lounge-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "lounge_images_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'lounge-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
