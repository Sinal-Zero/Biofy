-- The public plan lookup is intentionally callable without a session,
-- but authenticated users do not need a second execution path.
revoke execute on function public.get_public_plan(uuid) from public;
grant execute on function public.get_public_plan(uuid) to anon;
