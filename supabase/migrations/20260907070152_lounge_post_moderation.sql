-- Super Admin hide + lock comments on lounge posts
alter table public.lounge_posts
  add column if not exists hidden_at timestamptz,
  add column if not exists comments_locked_at timestamptz;

drop policy if exists "lounge_posts_select" on public.lounge_posts;

create policy "lounge_posts_select"
on public.lounge_posts for select to authenticated
using (
  public.can_access_student_lounge()
  and deleted_at is null
  and (
    hidden_at is null
    or public.current_user_role() = 'SUPER_ADMIN'
  )
);
