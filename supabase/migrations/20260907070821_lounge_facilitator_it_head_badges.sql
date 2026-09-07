-- Allow Facilitator and IT Head lounge badges
alter table public.profiles
  drop constraint if exists profiles_lounge_badge_check;

alter table public.profiles
  add constraint profiles_lounge_badge_check
  check (
    lounge_badge is null
    or lounge_badge in ('COACH', 'ADMIN', 'FACILITATOR', 'IT_HEAD')
  );
