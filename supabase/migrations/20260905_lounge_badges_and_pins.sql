-- Lounge badges on profiles + pin support for posts/comments
alter table public.profiles
  add column if not exists lounge_badge text
  check (lounge_badge is null or lounge_badge in ('COACH', 'ADMIN'));

alter table public.lounge_posts
  add column if not exists pinned_at timestamptz;

alter table public.lounge_comments
  add column if not exists pinned_at timestamptz;

create index if not exists lounge_posts_pinned_feed_idx
  on public.lounge_posts (pinned_at desc nulls last, created_at desc)
  where deleted_at is null;
