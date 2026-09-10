alter table public.subscriptions
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists asaas_payment_link_id text,
  add column if not exists asaas_last_event_id text;

create unique index if not exists subscriptions_asaas_customer_id_idx
  on public.subscriptions(asaas_customer_id)
  where asaas_customer_id is not null;

create unique index if not exists subscriptions_asaas_subscription_id_idx
  on public.subscriptions(asaas_subscription_id)
  where asaas_subscription_id is not null;

create table if not exists public.asaas_webhook_events (
  id text primary key,
  event text not null,
  processed_at timestamptz not null default now()
);

alter table public.asaas_webhook_events enable row level security;
revoke all on public.asaas_webhook_events from public, anon, authenticated;
grant all on public.asaas_webhook_events to service_role;

create or replace function public.find_user_id_by_email(target_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;
$$;

revoke all on function public.find_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_id_by_email(text) to service_role;
