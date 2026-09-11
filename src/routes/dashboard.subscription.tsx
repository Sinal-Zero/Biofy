import { createFileRoute } from "@tanstack/react-router";
import { Check, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { fetchSubscription } from "@/lib/bio-data";
import { isPaidSubscription } from "@/lib/subscription";

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
      "Analytics",
      "Sem branding",
    ],
  },
  {
    name: "Master",
    id: "business",
    price: "R$ 41,90/mês",
    checkoutUrl: "https://www.asaas.com/c/ynze63vc9bunge8g",
    features: [
      "Até 5 páginas",
      "Tudo do Pro",
      "Biofy AI",
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
  if (status === "trialing") return "Teste";
  if (status === "past_due") return "Pagamento pendente";
  if (status === "canceled" || status === "cancelled") return "Cancelada";
  return status;
}

function SubscriptionPage() {
  const { bundle } = useBio();
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  const refreshSubscription = useCallback(
    async (manual = false) => {
      if (manual) setChecking(true);
      try {
        setSubscription(await fetchSubscription(bundle.page.user_id));
      } finally {
        if (manual) setChecking(false);
        setLoading(false);
      }
    },
    [bundle.page.user_id],
  );

  useEffect(() => {
    let active = true;
    void fetchSubscription(bundle.page.user_id)
      .then((data) => {
        if (active) setSubscription(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleFocus = () => {
      if (active) void refreshSubscription();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [bundle.page.user_id, refreshSubscription]);

  const currentPlan = subscription?.plan ?? "free";
  const paidPlan = currentPlan === "pro" || currentPlan === "business";
  const hasPaidSubscription = isPaidSubscription(subscription);

  function startCheckout(planName: string, checkoutUrl: string) {
    setCheckoutPlan(planName);
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="biofy-page space-y-7">
      <header className="biofy-page-header">
        <p className="biofy-page-kicker">Plano</p>
        <h1 className="biofy-page-title">Assinatura</h1>
        <p className="biofy-page-description">
          Veja seu plano atual e escolha o nível de recursos que faz sentido para sua Bio.
        </p>
      </header>

      <section className="biofy-card p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-3 sm:items-end">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Plano atual</span>
            <strong className="mt-1 block text-2xl tracking-[-0.03em]">
              {loading ? "—" : planLabel(currentPlan)}
            </strong>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <strong className="mt-1 block text-sm font-medium">
              {loading ? "—" : paidPlan ? statusLabel(subscription?.status) : "Gratuito"}
            </strong>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Renovação</span>
            <strong className="mt-1 block text-sm font-medium">
              {subscription?.current_period_end && hasPaidSubscription
                ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      {!hasPaidSubscription ? (
        <div className="rounded-xl border border-border/85 bg-background/35 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="leading-6 text-muted-foreground">
                No checkout, use o mesmo e-mail da sua conta Biofy para a ativação automática.
              </p>
              {checkoutPlan ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <p className="flex-1 text-xs leading-5 text-muted-foreground">
                    Pagou o {checkoutPlan}? Ao voltar para esta aba, o plano é verificado novamente.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void refreshSubscription(true)}
                    disabled={checking}
                  >
                    {checking ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    )}
                    {checking ? "Verificando" : "Verificar pagamento"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const current = currentPlan === plan.id && (plan.id === "free" || hasPaidSubscription);
          const canCheckout = Boolean(plan.checkoutUrl) && !hasPaidSubscription;

          return (
            <article
              key={plan.id}
              className={`biofy-card flex h-full flex-col p-5 sm:p-6 ${
                current ? "border-primary/55" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-3 text-2xl font-bold tracking-[-0.035em]">{plan.price}</p>
                </div>
                {current ? <span className="biofy-status text-primary">Plano atual</span> : null}
              </div>

              <ul className="mt-5 flex-1 space-y-3 border-t border-border/70 pt-5 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 leading-5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {current ? (
                <div className="mt-6 rounded-[10px] border border-border/80 bg-background/35 px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                  Plano ativo
                </div>
              ) : canCheckout && plan.checkoutUrl ? (
                <Button
                  className="mt-6 w-full"
                  type="button"
                  onClick={() => startCheckout(plan.name, plan.checkoutUrl)}
                >
                  Assinar {plan.name}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              ) : plan.id === "free" ? (
                <Button className="mt-6 w-full" variant="outline" disabled>
                  Plano gratuito
                </Button>
              ) : (
                <Button
                  className="mt-6 h-auto min-h-10 w-full whitespace-normal py-2.5 text-center leading-5"
                  variant="outline"
                  disabled
                >
                  Encerre o plano atual antes de trocar
                </Button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
