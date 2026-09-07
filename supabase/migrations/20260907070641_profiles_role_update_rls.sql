-- Prefer profiles.role over JWT app_metadata so a stale token cannot
-- block Super Admin updates. JWT is only a fallback when no profile row exists.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (select role::text from public.profiles where id = auth.uid()),
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    ''
  );
$function$;

drop policy if exists "Super admins can update all profiles" on public.profiles;
create policy "Super admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'SUPER_ADMIN')
with check (public.current_user_role() = 'SUPER_ADMIN');

-- Regular admins may edit non-Super-Admin rows, but cannot assign SUPER_ADMIN.
drop policy if exists "Admins can update non-super-admin profiles" on public.profiles;
create policy "Admins can update non-super-admin profiles"
on public.profiles
for update
to authenticated
using (
  public.current_user_role() = 'ADMIN'
  and role <> 'SUPER_ADMIN'::user_role
)
with check (
  public.current_user_role() = 'ADMIN'
  and role <> 'SUPER_ADMIN'::user_role
);
