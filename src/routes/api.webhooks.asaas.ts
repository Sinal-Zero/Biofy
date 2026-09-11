import { createFileRoute } from "@tanstack/react-router";

const ASAAS_API_BASE = "https://api.asaas.com/v3";
const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const BLOCKED_EVENTS = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
]);
const CANCELED_SUBSCRIPTION_EVENTS = new Set(["SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"]);

type AsaasPayment = {
  id?: string;
  customer?: string;
  subscription?: string;
  paymentLink?: string;
  description?: string | null;
  value?: number;
  dueDate?: string;
};

type AsaasSubscription = {
  id?: string;
  customer?: string;
  description?: string | null;
  value?: number;
};

type AsaasWebhook = {
  id?: string;
  event?: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
};

type AsaasCustomer = {
  id?: string;
  email?: string | null;
};

type AsaasPaymentLink = {
  id?: string;
  name?: string;
  description?: string | null;
  value?: number;
};

function serviceHeaders(serviceRole: string) {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    "Content-Type": "application/json",
  };
}

function asaasHeaders(apiKey: string) {
  return {
    accept: "application/json",
    access_token: apiKey,
    "User-Agent": "Biofy/1.0 (billing webhook)",
  };
}

function inferPlan(input: { name?: string; description?: string | null; value?: number }) {
  const text = `${input.name ?? ""} ${input.description ?? ""}`.toLowerCase();
  if (text.includes("biofy master")) return "business" as const;
  if (text.includes("biofy pro")) return "pro" as const;
  if (text.includes("biofy")) {
    if (Math.abs(Number(input.value ?? 0) - 41.9) < 0.01) return "business" as const;
    if (Math.abs(Number(input.value ?? 0) - 21.9) < 0.01) return "pro" as const;
  }
  return null;
}

function nextMonthlyPeriod(dueDate?: string) {
  const base = dueDate ? new Date(`${dueDate}T12:00:00Z`) : new Date();
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  const next = new Date(safeBase);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next.toISOString();
}

function expiredNow() {
  return new Date(Date.now() - 60_000).toISOString();
}

async function asaasGet<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`${ASAAS_API_BASE}${path}`, {
    headers: asaasHeaders(apiKey),
  });
  if (!response.ok) {
    throw new Error(`ASAAS_${response.status}`);
  }
  return (await response.json()) as T;
}

async function alreadyProcessed(eventId: string, supabaseUrl: string, serviceRole: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/asaas_webhook_events?id=eq.${encodeURIComponent(eventId)}&select=id&limit=1`,
    { headers: serviceHeaders(serviceRole) },
  );
  if (!response.ok) throw new Error("SUPABASE_EVENT_LOOKUP_FAILED");
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

async function markProcessed(
  eventId: string,
  event: string,
  supabaseUrl: string,
  serviceRole: string,
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/asaas_webhook_events?on_conflict=id`, {
    method: "POST",
    headers: {
      ...serviceHeaders(serviceRole),
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: eventId, event }),
  });
  if (!response.ok) throw new Error("SUPABASE_EVENT_WRITE_FAILED");
}

async function findBiofyUserByEmail(email: string, supabaseUrl: string, serviceRole: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/find_user_id_by_email`, {
    method: "POST",
    headers: serviceHeaders(serviceRole),
    body: JSON.stringify({ target_email: email }),
  });
  if (!response.ok) throw new Error("SUPABASE_USER_LOOKUP_FAILED");
  const userId = (await response.json()) as string | null;
  return typeof userId === "string" && userId ? userId : null;
}

async function syncSubscription(
  input: {
    userId: string;
    plan?: "pro" | "business" | undefined;
    status: "active" | "past_due" | "canceled";
    currentPeriodEnd?: string | undefined;
    customerId?: string | undefined;
    subscriptionId?: string | undefined;
    paymentLinkId?: string | undefined;
    eventId: string;
  },
  supabaseUrl: string,
  serviceRole: string,
) {
  const payload: Record<string, unknown> = {
    user_id: input.userId,
    status: input.status,
    interval: "monthly",
    cancel_at_period_end: input.status === "canceled",
    asaas_last_event_id: input.eventId,
  };

  if (input.plan) payload["plan"] = input.plan;
  if (input.currentPeriodEnd) payload["current_period_end"] = input.currentPeriodEnd;
  if (input.customerId) payload["asaas_customer_id"] = input.customerId;
  if (input.subscriptionId) payload["asaas_subscription_id"] = input.subscriptionId;
  if (input.paymentLinkId) payload["asaas_payment_link_id"] = input.paymentLinkId;

  const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...serviceHeaders(serviceRole),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("SUPABASE_SUBSCRIPTION_WRITE_FAILED");
}

export const Route = createFileRoute("/api/webhooks/asaas")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, service: "Biofy Asaas webhook" }),
      POST: async ({ request }) => {
        const webhookToken = process.env["ASAAS_WEBHOOK_TOKEN"];
        const asaasApiKey = process.env["ASAAS_API_KEY"];
        const supabaseUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
        const serviceRole = process.env["SUPABASE_SERVICE_ROLE_KEY"];

        if (!webhookToken || !asaasApiKey || !supabaseUrl || !serviceRole) {
          return Response.json({ error: "Billing webhook is not configured." }, { status: 503 });
        }

        const receivedToken = request.headers.get("asaas-access-token");
        if (!receivedToken || receivedToken !== webhookToken) {
          return Response.json({ error: "Unauthorized webhook." }, { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as AsaasWebhook | null;
        const eventId = body?.id?.trim();
        const event = body?.event?.trim();
        if (!body || !eventId || !event) {
          return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
        }

        try {
          if (await alreadyProcessed(eventId, supabaseUrl, serviceRole)) {
            return Response.json({ ok: true, duplicate: true });
          }

          if (body.payment && (PAID_EVENTS.has(event) || BLOCKED_EVENTS.has(event))) {
            const payment = body.payment;
            if (!payment.customer) {
              await markProcessed(eventId, event, supabaseUrl, serviceRole);
              return Response.json({ ok: true, ignored: "missing_customer" });
            }

            const customer = await asaasGet<AsaasCustomer>(
              `/customers/${encodeURIComponent(payment.customer)}`,
              asaasApiKey,
            );
            const email = customer.email?.trim().toLowerCase();
            if (!email) {
              await markProcessed(eventId, event, supabaseUrl, serviceRole);
              return Response.json({ ok: true, ignored: "customer_without_email" });
            }

            const userId = await findBiofyUserByEmail(email, supabaseUrl, serviceRole);
            if (!userId) {
              await markProcessed(eventId, event, supabaseUrl, serviceRole);
              return Response.json({ ok: true, ignored: "biofy_user_not_found" });
            }

            let plan = inferPlan(payment);
            if (payment.paymentLink) {
              const paymentLink = await asaasGet<AsaasPaymentLink>(
                `/paymentLinks/${encodeURIComponent(payment.paymentLink)}`,
                asaasApiKey,
              );
              plan = inferPlan(paymentLink) ?? plan;
            }

            if (PAID_EVENTS.has(event)) {
              if (!plan) {
                await markProcessed(eventId, event, supabaseUrl, serviceRole);
                return Response.json({ ok: true, ignored: "unknown_biofy_plan" });
              }

              await syncSubscription(
                {
                  userId,
                  plan,
                  status: "active",
                  currentPeriodEnd: nextMonthlyPeriod(payment.dueDate),
                  customerId: payment.customer,
                  subscriptionId: payment.subscription,
                  paymentLinkId: payment.paymentLink,
                  eventId,
                },
                supabaseUrl,
                serviceRole,
              );
            } else {
              const canceled =
                event === "PAYMENT_REFUNDED" || event === "PAYMENT_CHARGEBACK_REQUESTED";
              await syncSubscription(
                {
                  userId,
                  plan: plan ?? undefined,
                  status: canceled ? "canceled" : "past_due",
                  currentPeriodEnd: expiredNow(),
                  customerId: payment.customer,
                  subscriptionId: payment.subscription,
                  paymentLinkId: payment.paymentLink,
                  eventId,
                },
                supabaseUrl,
                serviceRole,
              );
            }

            await markProcessed(eventId, event, supabaseUrl, serviceRole);
            return Response.json({ ok: true });
          }

          if (body.subscription && CANCELED_SUBSCRIPTION_EVENTS.has(event)) {
            const subscription = body.subscription;
            if (!subscription.customer) {
              await markProcessed(eventId, event, supabaseUrl, serviceRole);
              return Response.json({ ok: true, ignored: "missing_customer" });
            }

            const customer = await asaasGet<AsaasCustomer>(
              `/customers/${encodeURIComponent(subscription.customer)}`,
              asaasApiKey,
            );
            const email = customer.email?.trim().toLowerCase();
            if (!email) {
              await markProcessed(eventId, event, supabaseUrl, serviceRole);
              return Response.json({ ok: true, ignored: "customer_without_email" });
            }

            const userId = await findBiofyUserByEmail(email, supabaseUrl, serviceRole);
            if (!userId) {
              await markProcessed(eventId, event, supabaseUrl, serviceRole);
              return Response.json({ ok: true, ignored: "biofy_user_not_found" });
            }

            await syncSubscription(
              {
                userId,
                status: "canceled",
                currentPeriodEnd: expiredNow(),
                customerId: subscription.customer,
                subscriptionId: subscription.id,
                eventId,
              },
              supabaseUrl,
              serviceRole,
            );
            await markProcessed(eventId, event, supabaseUrl, serviceRole);
            return Response.json({ ok: true });
          }

          await markProcessed(eventId, event, supabaseUrl, serviceRole);
          return Response.json({ ok: true, ignored: "event_not_used" });
        } catch (error) {
          const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
          return Response.json({ error: code }, { status: 500 });
        }
      },
    },
  },
});
