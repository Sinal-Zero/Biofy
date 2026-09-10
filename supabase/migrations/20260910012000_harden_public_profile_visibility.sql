-- Public profile data must not reveal an unpublished account.
-- The public profile mirror is only useful when its page is published.
drop policy if exists public_profiles_read on public.public_profiles;

create policy public_profiles_read
  on public.public_profiles for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.pages p
      where p.username = public_profiles.username
        and p.is_published = true
        and p.username is not null
    )
  );
