import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
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
    features: ["1 página", "Links essenciais", "3 estilos base", "Branding Biofy"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "R$ 21,90/mês",
    features: [
      "Até 3 páginas",
      "Links ilimitados",
      "Personalização completa",
      "Analytics",
      "Sem branding",
    ],
  },
  {
    name: "Master",
    id: "business",
    price: "R$ 41,90/mês",
    features: [
      "Até 5 páginas",
      "Tudo do Pro",
      "Assistente de IA — em breve",
      "Analytics avançado",
      "Recursos profissionais",
    ],
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
  const hasPaidSubscription = currentPlan === "pro" || currentPlan === "business";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Plano</p>
        <h1 className="mt-1 text-3xl font-bold">Assinatura</h1>
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
                  : hasPaidSubscription
                    ? statusLabel(subscription?.status)
                    : "Gratuito"}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">Renovação</span>
              <strong className="mt-1 block font-medium">
                {subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                  : "—"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const current = currentPlan === plan.id;
          return (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-card p-5 transition sm:p-6 ${
                current
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/25"
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
              ) : (
                <Button className="mt-6 w-full" disabled>
                  Disponível com Asaas
                </Button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
