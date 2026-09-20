-- Student portfolios (one row per student, JSON blocks document)

create table if not exists public.student_portfolios (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  slug text not null,
  is_public boolean not null default false,
  template_id text not null default 'classic-medva',
  theme_id text not null default 'classic',
  blocks jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint student_portfolios_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) >= 3
    and char_length(slug) <= 48
  )
);

create unique index if not exists student_portfolios_slug_uidx
  on public.student_portfolios (slug);

create index if not exists student_portfolios_public_slug_idx
  on public.student_portfolios (slug)
  where is_public = true;

alter table public.student_portfolios enable row level security;

drop policy if exists "student_portfolios_select_own" on public.student_portfolios;
drop policy if exists "student_portfolios_insert_own" on public.student_portfolios;
drop policy if exists "student_portfolios_update_own" on public.student_portfolios;
drop policy if exists "student_portfolios_delete_own" on public.student_portfolios;

create policy "student_portfolios_select_own"
on public.student_portfolios for select to authenticated
using (student_id = (select auth.uid()));

create policy "student_portfolios_insert_own"
on public.student_portfolios for insert to authenticated
with check (
  student_id = (select auth.uid())
  and public.can_access_student_lounge()
);

create policy "student_portfolios_update_own"
on public.student_portfolios for update to authenticated
using (student_id = (select auth.uid()))
with check (
  student_id = (select auth.uid())
  and public.can_access_student_lounge()
);

create policy "student_portfolios_delete_own"
on public.student_portfolios for delete to authenticated
using (student_id = (select auth.uid()));

-- Private portfolio images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  false,
  3145728,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "portfolio_assets_select_own" on storage.objects;
drop policy if exists "portfolio_assets_insert_own" on storage.objects;
drop policy if exists "portfolio_assets_update_own" on storage.objects;
drop policy if exists "portfolio_assets_delete_own" on storage.objects;

create policy "portfolio_assets_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "portfolio_assets_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and public.can_access_student_lounge()
);

create policy "portfolio_assets_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "portfolio_assets_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'portfolio-assets'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
