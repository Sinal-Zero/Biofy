export const plans = [
  {
    name: "Starter",
    id: "starter",
    price: "R$ 9,90/mês",
    text: "Para começar",
    checkoutUrl: "https://www.asaas.com/c/2rzp3lp6bqbf7p9l",
    features: ["1 página", "Links essenciais", "3 estilos base"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "R$ 21,90/mês",
    text: "Para crescer",
    checkoutUrl: "https://www.asaas.com/c/5a65xpt3sm57axni",
    features: ["Até 3 páginas", "Links ilimitados", "Personalização completa", "Analytics", "Sem branding"],
  },
  {
    name: "Master",
    id: "master",
    price: "R$ 41,90/mês",
    text: "Para marcas e negócios",
    checkoutUrl: "https://www.asaas.com/c/5a65xpt3sm57axni",
    features: ["Até 5 páginas", "Tudo do Pro", "Biofy AI", "Analytics avançado", "Recursos profissionais"],
  },
] as const;

type PlanId = (typeof plans)[number]["id"];
type PlanName = (typeof plans)[number]["name"];

const idToName: Record<PlanId, PlanName> = {
  starter: "Starter",
  pro: "Pro",
  master: "Master",
};

export function planName(id: PlanId): PlanName {
  return idToName[id];
}

export function planId(name: string): PlanId | null {
  if (name === "Starter") return "starter";
  if (name === "Pro") return "pro";
  if (name === "Master") return "master";
  return null;
}
