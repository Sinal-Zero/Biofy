import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
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
    <div className="biofy-page space-y-6 sm:space-y-7">
      <header className="biofy-page-header">
        <p className="biofy-page-kicker">Plano</p>
        <h1 className="biofy-page-title">Assinatura</h1>
        <p className="biofy-page-description">
          Gerencie seu plano e acompanhe o status da cobrança.
        </p>
      </header>

      <section className="biofy-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/[0.07] text-primary">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <span className="text-xs text-muted-foreground">Plano atual</span>
              <strong className="block text-xl">{loading ? "—" : planLabel(currentPlan)}</strong>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm lg:text-right">
            <div>
              <span className="block text-xs text-muted-foreground">Status</span>
              <strong className="mt-1 block font-medium">
                {loading ? "—" : paidPlan ? statusLabel(subscription?.status) : "Gratuito"}
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
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="leading-6 text-muted-foreground">
                Use{" "}
                <strong className="font-semibold text-foreground">
                  o mesmo e-mail da sua conta Biofy
                </strong>{" "}
                no checkout para ativação automática.
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
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
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
              className={`biofy-card relative flex h-full flex-col p-5 sm:p-6 ${
                current ? "border-primary/70 ring-2 ring-primary/10" : "biofy-card-interactive"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {current ? (
                  <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Atual
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{plan.price}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 leading-5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {current ? (
                <div className="mt-6 rounded-xl border border-primary/15 bg-primary/[0.05] px-3 py-2.5 text-center text-xs font-semibold text-primary">
                  Plano ativo
                </div>
              ) : canCheckout && plan.checkoutUrl ? (
                <Button
                  className="mt-6 w-full"
                  type="button"
                  onClick={() => startCheckout(plan.name, plan.checkoutUrl)}
                >
                  Assinar {plan.name}
                  <ExternalLink className="ml-2 h-4 w-4" />
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
