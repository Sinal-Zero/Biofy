export type SubscriptionLike =
  | {
      plan?: string | null;
      status?: string | null;
      current_period_end?: string | null;
    }
  | null
  | undefined;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function isSubscriptionActive(subscription: SubscriptionLike) {
  if (!subscription?.status || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) return false;
  if (!subscription.current_period_end) return true;

  const periodEnd = new Date(subscription.current_period_end).getTime();
  return Number.isFinite(periodEnd) && periodEnd >= Date.now();
}

export function isPaidSubscription(subscription: SubscriptionLike) {
  return Boolean(
    subscription &&
      (subscription.plan === "pro" || subscription.plan === "business") &&
      isSubscriptionActive(subscription),
  );
}

export function isMasterSubscription(subscription: SubscriptionLike) {
  return Boolean(subscription?.plan === "business" && isSubscriptionActive(subscription));
}
