-- Student wallet: balance + ledger + PayMongo top-ups

create type public.wallet_txn_type as enum (
  'TOP_UP',
  'ENROLL_SPEND',
  'SESSION_REFUND',
  'ADMIN_ADJUST'
);

create type public.wallet_topup_status as enum (
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED'
);

create table public.wallets (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  currency text not null default 'PHP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  type public.wallet_txn_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  direction text not null check (direction in ('credit', 'debit')),
  balance_after numeric(12, 2) not null check (balance_after >= 0),
  reference_type text,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index wallet_transactions_student_created_idx
  on public.wallet_transactions (student_id, created_at desc);

create table public.wallet_topups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'PHP',
  status public.wallet_topup_status not null default 'PENDING',
  provider text not null default 'PAYMONGO',
  provider_payment_id text,
  intent_enrollment_id uuid references public.enrollments (id) on delete set null,
  intent_course_id uuid references public.courses (id) on delete set null,
  intent_session_id uuid references public.sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wallet_topups_student_created_idx
  on public.wallet_topups (student_id, created_at desc);

create index wallet_topups_provider_payment_idx
  on public.wallet_topups (provider_payment_id)
  where provider_payment_id is not null;

-- Atomic credit/debit via security definer (service + authenticated server actions use service role)

create or replace function public.wallet_apply_txn(
  p_student_id uuid,
  p_type public.wallet_txn_type,
  p_amount numeric,
  p_direction text,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_note text default null
)
returns table (
  balance numeric,
  transaction_id uuid
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_balance numeric(12, 2);
  v_new_balance numeric(12, 2);
  v_txn_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_direction not in ('credit', 'debit') then
    raise exception 'Invalid direction';
  end if;

  insert into public.wallets (student_id, balance, currency)
  values (p_student_id, 0, 'PHP')
  on conflict (student_id) do nothing;

  select w.balance into v_balance
  from public.wallets w
  where w.student_id = p_student_id
  for update;

  if v_balance is null then
    raise exception 'Wallet not found';
  end if;

  if p_direction = 'credit' then
    v_new_balance := v_balance + p_amount;
  else
    if v_balance < p_amount then
      raise exception 'Insufficient wallet balance';
    end if;
    v_new_balance := v_balance - p_amount;
  end if;

  update public.wallets
  set balance = v_new_balance, updated_at = now()
  where student_id = p_student_id;

  insert into public.wallet_transactions (
    student_id, type, amount, direction, balance_after,
    reference_type, reference_id, note
  )
  values (
    p_student_id, p_type, p_amount, p_direction, v_new_balance,
    p_reference_type, p_reference_id, p_note
  )
  returning id into v_txn_id;

  balance := v_new_balance;
  transaction_id := v_txn_id;
  return next;
end;
$$;

revoke all on function public.wallet_apply_txn(uuid, public.wallet_txn_type, numeric, text, text, uuid, text) from public;
grant execute on function public.wallet_apply_txn(uuid, public.wallet_txn_type, numeric, text, text, uuid, text) to service_role;

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.wallet_topups enable row level security;

create policy wallets_select_own
  on public.wallets for select
  to authenticated
  using (student_id = auth.uid());

create policy wallet_transactions_select_own
  on public.wallet_transactions for select
  to authenticated
  using (student_id = auth.uid());

create policy wallet_topups_select_own
  on public.wallet_topups for select
  to authenticated
  using (student_id = auth.uid());

-- No insert/update/delete policies for authenticated — writes via service role only
