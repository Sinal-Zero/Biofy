import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
    features: ["Página pública", "Links básicos", "Templates básicos", "Branding Biofy"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "R$ 21,90/mês",
    features: [
      "Links ilimitados",
      "Todos os templates",
      "Personalização avançada",
      "Analytics",
      "Sem branding",
    ],
  },
  {
    name: "Business",
    id: "business",
    price: "R$ 41,90/mês",
    features: [
      "Tudo do Pro",
      "Assistente de IA para montar sua Bio",
      "Recursos profissionais",
      "Analytics avançado",
      "Preparado para domínio personalizado",
    ],
  },
] as const;

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Plano e cobrança</p>
        <h1 className="mt-1 text-3xl font-bold">Assinatura</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A cobrança real ainda não está habilitada. Esta tela não simula pagamento nem upgrade.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="text-xs text-muted-foreground">Plano atual</span>
            <strong className="mt-1 block text-lg capitalize">{loading ? "—" : currentPlan}</strong>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <strong className="mt-1 block text-lg capitalize">
              {loading ? "—" : (subscription?.status ?? "active")}
            </strong>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Próxima cobrança</span>
            <strong className="mt-1 block text-lg">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                : "Não aplicável"}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const current = currentPlan === plan.id;
          return (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-card p-5 sm:p-6 ${current ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {current ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
                    Atual
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
              <Button className="mt-6 w-full" variant={current ? "outline" : "default"} disabled>
                {current ? "Plano atual" : "Upgrade em breve"}
              </Button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
