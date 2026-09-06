-- Saved payout number + hashed withdrawal PIN on profiles

alter table public.profiles
  add column if not exists withdrawal_number text,
  add column if not exists withdrawal_pin_hash text,
  add column if not exists withdrawal_pin_set_at timestamptz;

create or replace function public.profiles_protect_withdrawal_pin()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and auth.role() is distinct from 'service_role' then
    new.withdrawal_pin_hash := old.withdrawal_pin_hash;
    new.withdrawal_pin_set_at := old.withdrawal_pin_set_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_withdrawal_pin on public.profiles;
create trigger profiles_protect_withdrawal_pin
before update on public.profiles
for each row
execute function public.profiles_protect_withdrawal_pin();
