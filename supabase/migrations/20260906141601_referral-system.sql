-- Direct referral codes, per-course commissions, and wallet earnings

alter type public.wallet_txn_type add value if not exists 'REFERRAL_EARNINGS';

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;

create or replace function public.profiles_protect_referral()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if old.referred_by is not null and new.referred_by is distinct from old.referred_by then
      new.referred_by := old.referred_by;
    end if;
    if old.referral_code is not null and new.referral_code is distinct from old.referral_code then
      new.referral_code := old.referral_code;
    end if;
  end if;
  if new.referred_by is not null and new.referred_by = new.id then
    new.referred_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_referral on public.profiles;
create trigger profiles_protect_referral
before insert or update on public.profiles
for each row
execute function public.profiles_protect_referral();

create table if not exists public.course_referral_commissions (
  course_id uuid primary key references public.courses (id) on delete cascade,
  mode text not null check (mode in ('FIXED', 'PERCENT')),
  value numeric(12, 2) not null default 0 check (value >= 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint course_referral_percent_range check (
    mode <> 'PERCENT' or value <= 100
  )
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referee_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  wallet_txn_id uuid references public.wallet_transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint referral_rewards_enrollment_uidx unique (enrollment_id),
  constraint referral_rewards_not_self check (referrer_id <> referee_id)
);

create index if not exists referral_rewards_referrer_idx
  on public.referral_rewards (referrer_id, created_at desc);

alter table public.course_referral_commissions enable row level security;
alter table public.referral_rewards enable row level security;

create policy course_referral_commissions_staff_select
  on public.course_referral_commissions for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy course_referral_commissions_staff_write
  on public.course_referral_commissions for all
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy referral_rewards_own_select
  on public.referral_rewards for select
  to authenticated
  using (
    referrer_id = auth.uid()
    or public.current_user_role() in ('ADMIN', 'SUPER_ADMIN')
  );
