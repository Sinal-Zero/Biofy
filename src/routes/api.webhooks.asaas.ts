import { createFileRoute } from "@tanstack/react-router";

const ASAAS_API_BASE = "https://api.asaas.com/v3";
const MAX_WEBHOOK_BYTES = 256_000;
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

function serviceHeaders(serviceKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: serviceKey,
    "Content-Type": "application/json",
  };

  // New sb_secret_* keys are opaque API keys, not JWTs. Sending them as a
  // Bearer token makes Supabase attempt JWT parsing and reject the request.
  if (!serviceKey.startsWith("sb_secret_")) {
    headers["Authorization"] = `Bearer ${serviceKey}`;
  }

  return headers;
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
  const val = Math.round((Number(input.value ?? 0) + 1e-6) * 100) / 100;
  const textPlan = text.includes("biofy master") ? "business" : text.includes("biofy pro") ? "pro" : text.includes("biofy starter") ? "starter" : null;
  const valPlan = Math.abs(val - 41.9) < 0.01 ? "business" : Math.abs(val - 21.9) < 0.01 ? "pro" : Math.abs(val - 9.9) < 0.01 ? "starter" : null;
  if (textPlan && valPlan && textPlan !== valPlan) return "conflict" as const;
  return (textPlan || valPlan) as "business" | "pro" | "starter" | null;
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
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`ASAAS_${response.status}`);
  return (await response.json()) as T;
}

async function alreadyProcessed(eventId: string, supabaseUrl: string, serviceKey: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/asaas_webhook_events?id=eq.${encodeURIComponent(eventId)}&select=id&limit=1`,
    { headers: serviceHeaders(serviceKey), signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) throw new Error("SUPABASE_EVENT_LOOKUP_FAILED");
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

async function markProcessed(
  eventId: string,
  event: string,
  supabaseUrl: string,
  serviceKey: string,
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/asaas_webhook_events?on_conflict=id`, {
    method: "POST",
    headers: {
      ...serviceHeaders(serviceKey),
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({ id: eventId, event }),
  });
  if (!response.ok) throw new Error("SUPABASE_EVENT_WRITE_FAILED");
}

async function findBiofyUserByEmail(email: string, supabaseUrl: string, serviceKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/find_user_id_by_email`, {
    method: "POST",
    headers: serviceHeaders(serviceKey),
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({ target_email: email }),
  });
  if (!response.ok) throw new Error("SUPABASE_USER_LOOKUP_FAILED");
  const userId = (await response.json()) as string | null;
  return typeof userId === "string" && userId ? userId : null;
}

async function syncSubscription(
  input: {
    userId: string;
    plan?: "starter" | "pro" | "business" | undefined;
    status: "active" | "past_due" | "canceled";
    currentPeriodEnd?: string | undefined;
    customerId?: string | undefined;
    subscriptionId?: string | undefined;
    paymentLinkId?: string | undefined;
    eventId: string;
  },
  supabaseUrl: string,
  serviceKey: string,
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
      ...serviceHeaders(serviceKey),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("SUPABASE_SUBSCRIPTION_WRITE_FAILED");
}

function parseWebhookBody(raw: string): AsaasWebhook | null {
  if (!raw || raw.length > MAX_WEBHOOK_BYTES) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as AsaasWebhook)
      : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/webhooks/asaas")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { ok: true, service: "Biofy Asaas webhook" },
          { headers: { "Cache-Control": "no-store" } },
        ),
      POST: async ({ request }) => {
        const webhookToken = process.env["ASAAS_WEBHOOK_TOKEN"]?.trim();
        const asaasApiKey = process.env["ASAAS_API_KEY"]?.trim();
        const supabaseUrl = (
          process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"]
        )?.trim();
        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();

        if (!webhookToken || !asaasApiKey || !supabaseUrl || !serviceKey) {
          return Response.json(
            { error: "Billing webhook is not configured." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }

        const receivedToken = request.headers.get("asaas-access-token");
        if (!receivedToken || receivedToken !== webhookToken) {
          return Response.json(
            { error: "Unauthorized webhook." },
            { status: 401, headers: { "Cache-Control": "no-store" } },
          );
        }

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
          return Response.json(
            { error: "Webhook payload too large." },
            { status: 413, headers: { "Cache-Control": "no-store" } },
          );
        }

        const rawBody = await request.text();
        const body = parseWebhookBody(rawBody);
        const eventId = body?.id?.trim().slice(0, 160);
        const event = body?.event?.trim().slice(0, 120);
        if (!body || !eventId || !event) {
          return Response.json(
            { error: "Invalid webhook payload." },
            { status: 400, headers: { "Cache-Control": "no-store" } },
          );
        }

        try {
          if (await alreadyProcessed(eventId, supabaseUrl, serviceKey)) {
            return Response.json(
              { ok: true, duplicate: true },
              { headers: { "Cache-Control": "no-store" } },
            );
          }

          if (body.payment && (PAID_EVENTS.has(event) || BLOCKED_EVENTS.has(event))) {
            const payment = body.payment;
            if (!payment.customer) {
              console.error("[Biofy billing] missing_customer", { traceId: crypto.randomUUID(), eventId, paymentId: payment.id ?? null, reason: "missing_customer" });
              return Response.json({ error: "Billing webhook retryable failure: missing_customer", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
            }

            const customer = await asaasGet<AsaasCustomer>(
              `/customers/${encodeURIComponent(payment.customer)}`,
              asaasApiKey,
            );
            const email = customer.email?.trim().toLowerCase();
            if (!email) {
              console.error("[Biofy billing] customer_without_email", { traceId: crypto.randomUUID(), eventId, paymentId: payment.id ?? null, reason: "customer_without_email" });
              return Response.json({ error: "Billing webhook retryable failure: customer_without_email", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
            }

            const userId = await findBiofyUserByEmail(email, supabaseUrl, serviceKey);
            if (!userId) {
              console.error("[Biofy billing] biofy_user_not_found", { traceId: crypto.randomUUID(), eventId, paymentId: (subscription.id ?? subscription.customer ?? null) as string, maskedEmail: email ? email.slice(0,2)+"***" : null, reason: "biofy_user_not_found" });
              return Response.json({ error: "Billing webhook retryable failure: biofy_user_not_found", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
            }

            let plan = inferPlan(payment); if (plan === "conflict") { console.error("conflict",{traceId:crypto.randomUUID(),eventId,paymentId:payment.id??null}); return Response.json({error:"plan_conflict",traceId:crypto.randomUUID()},{status:500}); }
            if (plan === "conflict") {
              console.error("[Biofy billing] plan_conflict", { traceId: crypto.randomUUID(), eventId, paymentId: payment.id ?? null, reason: "plan_conflict" });
              return Response.json({ error: "Billing webhook retryable failure: plan_conflict", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
            }
            if (payment.paymentLink) {
              const paymentLink = await asaasGet<AsaasPaymentLink>(
                `/paymentLinks/${encodeURIComponent(payment.paymentLink)}`,
                asaasApiKey,
              );
              plan = (inferPlan(paymentLink) ?? plan) === "conflict" ? undefined : (inferPlan(paymentLink) ?? plan);
            }

            if (PAID_EVENTS.has(event)) {
              if (!plan) {
                console.error("[Biofy billing] unknown_biofy_plan", { traceId: crypto.randomUUID(), eventId, paymentId: payment.id ?? null, reason: "unknown_biofy_plan" });
                return Response.json({ error: "Billing webhook retryable failure: unknown_biofy_plan", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
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
                serviceKey,
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
                serviceKey,
              );
            }

            await markProcessed(eventId, event, supabaseUrl, serviceKey);
            return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
          }

          if (body.subscription && CANCELED_SUBSCRIPTION_EVENTS.has(event)) {
            const subscription = body.subscription;
            if (!subscription.customer) {
              await markProcessed(eventId, event, supabaseUrl, serviceKey);
              return Response.json({ ok: true, ignored: "missing_customer" });
            }

            const customer = await asaasGet<AsaasCustomer>(
              `/customers/${encodeURIComponent(subscription.customer)}`,
              asaasApiKey,
            );
            const email = customer.email?.trim().toLowerCase();
            if (!email) {
              console.error("[Biofy billing] customer_without_email", { traceId: crypto.randomUUID(), eventId, paymentId: payment.id ?? null, reason: "customer_without_email" });
              return Response.json({ error: "Billing webhook retryable failure: customer_without_email", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
            }

            const userId = await findBiofyUserByEmail(email, supabaseUrl, serviceKey);
            if (!userId) {
              console.error("[Biofy billing] biofy_user_not_found", { traceId: crypto.randomUUID(), eventId, paymentId: (subscription.id ?? subscription.customer ?? null) as string, maskedEmail: email ? email.slice(0,2)+"***" : null, reason: "biofy_user_not_found" });
              return Response.json({ error: "Billing webhook retryable failure: biofy_user_not_found", traceId: crypto.randomUUID() }, { status: 500, headers: { "Cache-Control": "no-store" } });
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
              serviceKey,
            );
            await markProcessed(eventId, event, supabaseUrl, serviceKey);
            return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
          }

          await markProcessed(eventId, event, supabaseUrl, serviceKey);
          return Response.json(
            { ok: true, ignored: "event_not_used" },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          const traceId = crypto.randomUUID();
          console.error("[Biofy billing] webhook processing failed", {
            traceId,
            eventId,
            event,
            code: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          });
          return Response.json(
            { error: "Billing webhook failed.", traceId },
            { status: 500, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
