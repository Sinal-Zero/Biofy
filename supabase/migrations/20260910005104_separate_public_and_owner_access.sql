drop policy if exists pages_public_read on public.pages;
create policy pages_public_read
  on public.pages for select
  to anon
  using (is_published = true and username is not null);

drop policy if exists blocks_public_read on public.page_blocks;
create policy blocks_public_read
  on public.page_blocks for select
  to anon
  using (
    is_visible = true
    and exists (
      select 1
      from public.pages p
      where p.id = page_id
        and p.is_published = true
        and p.username is not null
    )
  );

revoke select on public.pages from anon, authenticated;
grant select (id, username, template, theme, is_published, published_at, created_at, updated_at)
  on public.pages to anon;
grant select on public.pages to authenticated;

revoke select on public.page_blocks from anon, authenticated;
grant select (id, page_id, type, title, url, config, position, is_visible, created_at, updated_at)
  on public.page_blocks to anon;
grant select on public.page_blocks to authenticated;
