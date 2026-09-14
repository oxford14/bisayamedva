-- Defer registration account creation until payment succeeds.

create type public.registration_intent_status as enum (
  'PENDING',
  'FULFILLED',
  'EXPIRED'
);

create table public.registration_intents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  course_id uuid not null references public.courses (id) on delete cascade,
  payload_ciphertext text not null default '',
  payload_iv text not null default '',
  promo_code_id uuid references public.promo_codes (id) on delete set null,
  original_amount numeric(12, 2),
  final_amount numeric(12, 2),
  ref_code text,
  status public.registration_intent_status not null default 'PENDING',
  fulfilled_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index registration_intents_email_status_idx
  on public.registration_intents (lower(email), status);

create index registration_intents_pending_expires_idx
  on public.registration_intents (expires_at)
  where status = 'PENDING';

alter table public.registration_intents enable row level security;

alter table public.payments
  alter column enrollment_id drop not null;

alter table public.payments
  add column if not exists registration_intent_id uuid references public.registration_intents (id) on delete set null;

alter table public.payments
  add column if not exists poll_secret text;

create index payments_registration_intent_idx
  on public.payments (registration_intent_id)
  where registration_intent_id is not null;
