-- Promo codes for registration checkout

create type public.promo_discount_type as enum ('FIXED', 'PERCENT');

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type public.promo_discount_type not null,
  discount_value numeric(12, 2) not null check (discount_value > 0),
  max_redemptions integer null check (max_redemptions is null or max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_codes_code_upper unique (code),
  constraint promo_codes_percent_range check (
    discount_type <> 'PERCENT' or (discount_value > 0 and discount_value <= 100)
  ),
  constraint promo_codes_slots_ok check (
    max_redemptions is null or redeemed_count <= max_redemptions
  )
);

create index promo_codes_active_idx on public.promo_codes (active, code);

alter table public.payments
  add column if not exists promo_code_id uuid null references public.promo_codes (id) on delete set null,
  add column if not exists original_amount numeric(12, 2) null;

create index payments_promo_code_idx on public.payments (promo_code_id)
  where promo_code_id is not null;

-- Atomically reserve a promo slot when binding to a payment (if not already counted for this payment)
create or replace function public.promo_reserve_slot(p_promo_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  updated int;
begin
  update public.promo_codes
  set
    redeemed_count = redeemed_count + 1,
    updated_at = now()
  where id = p_promo_id
    and active = true
    and (max_redemptions is null or redeemed_count < max_redemptions)
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now());

  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

revoke all on function public.promo_reserve_slot(uuid) from public;
grant execute on function public.promo_reserve_slot(uuid) to service_role;

alter table public.promo_codes enable row level security;

-- Admins read/write via authenticated policies; public has no access (server uses service role)
create policy promo_codes_admin_select
  on public.promo_codes for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy promo_codes_admin_insert
  on public.promo_codes for insert
  to authenticated
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));

create policy promo_codes_admin_update
  on public.promo_codes for update
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'))
  with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));
