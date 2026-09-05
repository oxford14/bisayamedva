-- Fall back to profiles.role when JWT app_metadata.role is missing.
-- Classmate profile RLS depends on current_user_role() = 'STUDENT'.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    (select role::text from public.profiles where id = auth.uid()),
    ''
  );
$function$;
