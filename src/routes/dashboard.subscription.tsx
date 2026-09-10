import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { fetchSubscription } from "@/lib/bio-data";

export const Route = createFileRoute("/dashboard/subscription")({
  component: SubscriptionPage,
});

type Subscription = Awaited<ReturnType<typeof fetchSubscription>>;

const plans = [
  {
    name: "Free",
    id: "free",
    price: "R$ 0",
    checkoutUrl: null,
    features: ["1 página", "Links essenciais", "3 estilos base", "Branding Biofy"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "R$ 21,90/mês",
    checkoutUrl: "https://www.asaas.com/c/5a65xpt3sm57axni",
    features: [
      "Até 3 páginas",
      "Links ilimitados",
      "Personalização completa",
      "Assistente de IA",
      "Analytics",
      "Sem branding",
    ],
  },
  {
    name: "Master",
    id: "business",
    price: "R$ 41,90/mês",
    checkoutUrl: "https://www.asaas.com/c/ynze63vc9bunge8g",
    features: ["Até 5 páginas", "Tudo do Pro", "Analytics avançado", "Recursos profissionais"],
  },
] as const;

function planLabel(plan: string) {
  if (plan === "business") return "Master";
  if (plan === "pro") return "Pro";
  return "Free";
}

function statusLabel(status: string | null | undefined) {
  if (!status || status === "active") return "Ativa";
  if (status === "trialing") return "Período de teste";
  if (status === "past_due") return "Pagamento pendente";
  if (status === "canceled" || status === "cancelled") return "Cancelada";
  return status;
}

function SubscriptionPage() {
  const { bundle } = useBio();
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSubscription(bundle.page.user_id)
      .then((data) => {
        if (active) setSubscription(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bundle.page.user_id]);

  const currentPlan = subscription?.plan ?? "free";
  const hasPaidSubscription =
    (currentPlan === "pro" || currentPlan === "business") &&
    (!subscription?.status || ["active", "trialing"].includes(subscription.status));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Plano</p>
        <h1 className="mt-1 text-3xl font-bold">Assinatura</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Escolha seu plano e conclua o pagamento com segurança pelo Asaas.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <span className="text-xs text-muted-foreground">Seu plano</span>
              <strong className="block text-xl">{loading ? "—" : planLabel(currentPlan)}</strong>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
            <div>
              <span className="block text-xs text-muted-foreground">Status</span>
              <strong className="mt-1 block font-medium">
                {loading
                  ? "—"
                  : currentPlan === "pro" || currentPlan === "business"
                    ? statusLabel(subscription?.status)
                    : "Gratuito"}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Renovação</span>
              <strong className="mt-1 block font-medium">
                {subscription?.current_period_end && hasPaidSubscription
                  ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                  : "—"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {!hasPaidSubscription ? (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] px-4 py-3.5 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-5 text-muted-foreground">
            No checkout, use <strong className="font-semibold text-foreground">o mesmo e-mail da sua conta Biofy</strong>.
            Assim o pagamento é identificado e o plano é ativado automaticamente.
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const current = currentPlan === plan.id && (plan.id === "free" || hasPaidSubscription);
          const canCheckout = Boolean(plan.checkoutUrl) && !hasPaidSubscription;

          return (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-card p-5 transition duration-300 sm:p-6 ${
                current
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {current ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
                    Plano atual
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-bold">{plan.price}</p>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {current ? (
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/[0.05] px-3 py-2.5 text-center text-xs font-medium text-primary">
                  Você já está neste plano
                </div>
              ) : canCheckout && plan.checkoutUrl ? (
                <Button className="mt-6 w-full" asChild>
                  <a href={plan.checkoutUrl} target="_blank" rel="noreferrer noopener">
                    Assinar {plan.name}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : plan.id === "free" ? (
                <Button className="mt-6 w-full" variant="outline" disabled>
                  Plano gratuito
                </Button>
              ) : (
                <Button className="mt-6 w-full" variant="outline" disabled>
                  Cancele o plano atual antes de trocar
                </Button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
