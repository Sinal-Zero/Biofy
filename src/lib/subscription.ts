export type SubscriptionLike = {
  plan?: string | null;
  status?: string | null;
  current_period_end?: string | null;
} | null | undefined;

export function isSubscriptionActive(subscription: SubscriptionLike) {
  if (!subscription) return false;
  const statusActive = !subscription.status || ["active", "trialing"].includes(subscription.status);
  const periodActive =
    !subscription.current_period_end || new Date(subscription.current_period_end).getTime() >= Date.now();
  return statusActive && periodActive;
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
