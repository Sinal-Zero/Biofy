alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check,
  add constraint subscriptions_plan_check check (plan in ('free','pro','business','starter'));
