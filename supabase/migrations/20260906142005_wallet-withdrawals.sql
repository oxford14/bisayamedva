-- Wallet withdrawals: hold funds on request, admin reviews payout

alter type public.wallet_txn_type add value if not exists 'WITHDRAWAL';
alter type public.wallet_txn_type add value if not exists 'WITHDRAWAL_REFUND';

create type public.wallet_withdrawal_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

create type public.wallet_payout_method as enum (
  'GCASH',
  'MAYA',
  'BANK'
);

create table public.wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method public.wallet_payout_method not null,
  account_name text not null,
  account_number text not null,
  bank_name text,
  status public.wallet_withdrawal_status not null default 'PENDING',
  hold_txn_id uuid references public.wallet_transactions (id) on delete set null,
  refund_txn_id uuid references public.wallet_transactions (id) on delete set null,
  review_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_withdrawals_bank_name_chk check (
    method <> 'BANK' or (bank_name is not null and length(btrim(bank_name)) > 0)
  )
);

create unique index wallet_withdrawals_one_pending_idx
  on public.wallet_withdrawals (student_id)
  where status = 'PENDING';

create index wallet_withdrawals_status_created_idx
  on public.wallet_withdrawals (status, created_at desc);

create index wallet_withdrawals_student_created_idx
  on public.wallet_withdrawals (student_id, created_at desc);

alter table public.wallet_withdrawals enable row level security;

create policy wallet_withdrawals_select_own
  on public.wallet_withdrawals for select
  to authenticated
  using (student_id = auth.uid());

create policy wallet_withdrawals_staff_select
  on public.wallet_withdrawals for select
  to authenticated
  using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN'));
