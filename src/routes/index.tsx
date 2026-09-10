import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  LayoutTemplate,
  Link2,
  Palette,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import type { BioBlock } from "@/lib/bio-types";
import { templates } from "@/lib/templates";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const demoBlocks: BioBlock[] = [
  {
    id: "demo-1",
    page_id: "demo",
    type: "link",
    title: "Meu portfólio",
    url: "https://example.com",
    config: {},
    position: 0,
    is_visible: true,
  },
  {
    id: "demo-2",
    page_id: "demo",
    type: "instagram",
    title: "Instagram",
    url: "https://instagram.com",
    config: {},
    position: 1,
    is_visible: true,
  },
  {
    id: "demo-3",
    page_id: "demo",
    type: "youtube",
    title: "YouTube",
    url: "https://youtube.com",
    config: {},
    position: 2,
    is_visible: true,
  },
  {
    id: "demo-4",
    page_id: "demo",
    type: "whatsapp",
    title: "WhatsApp",
    url: "https://wa.me/5500000000000",
    config: {},
    position: 3,
    is_visible: true,
  },
];

const resources = [
  {
    icon: Palette,
    title: "Personalização de verdade",
    text: "Cores, tipografia, fundo, botões, espaçamento e identidade visual.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates prontos",
    text: "Comece bonito em segundos e continue personalizando sem bloqueios.",
  },
  {
    icon: Link2,
    title: "Links e blocos",
    text: "Organize seus destinos, redes, textos e imagens em uma página única.",
  },
  {
    icon: BarChart3,
    title: "Analytics reais",
    text: "Veja visualizações, cliques e CTR sem números inventados.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    text: "Feito para abrir rápido e funcionar bem dentro do Instagram e no celular.",
  },
  {
    icon: Sparkles,
    title: "Editor visual",
    text: "Você vê o resultado enquanto cria e as alterações são salvas automaticamente.",
  },
];

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    text: "Para começar",
    features: ["Até 1 página", "Username", "Links básicos", "Templates básicos"],
  },
  {
    name: "Pro",
    price: "R$ 21,90/mês",
    text: "Para crescer",
    features: [
      "Até 3 páginas",
      "Links ilimitados",
      "Todos os templates",
      "Personalização avançada",
      "Analytics",
    ],
  },
  {
    name: "Master",
    price: "R$ 41,90/mês",
    text: "Para marcas e negócios",
    features: [
      "Até 5 páginas",
      "Tudo do Pro",
      "Assistente de IA para montar sua Bio — em breve",
      "Recursos profissionais",
      "Analytics avançado",
      "Base para domínio próprio",
    ],
  },
];

function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#como-funciona" className="transition hover:text-foreground">
              Como funciona
            </a>
            <a href="#templates" className="transition hover:text-foreground">
              Templates
            </a>
            <a href="#recursos" className="transition hover:text-foreground">
              Recursos
            </a>
            <a href="#precos" className="transition hover:text-foreground">
              Preços
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Criar minha Bio</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-8 lg:pb-32">
          <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-50" />
          <div className="pointer-events-none absolute left-1/2 top-10 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Mais que links. É você.
              </div>
              <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Sua bio. <span className="gradient-text">Do seu jeito.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Reúna tudo o que importa em uma página que realmente parece sua. Escolha um
                template, personalize, publique e compartilhe um único link.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Criar minha Bio <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#templates">Explorar templates</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Comece grátis
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Sem precisar programar
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Preview em tempo real
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-12 rounded-full bg-brand-2/15 blur-3xl" />
              <PhoneFrame className="relative animate-[biofy-float_6s_ease-in-out_infinite]">
                <BioPreview
                  displayName="Marina Costa"
                  username="marina"
                  bio="Design, fotografia e coisas que eu gosto de criar."
                  avatarUrl={null}
                  theme={templates.find((template) => template.id === "gradient")?.theme}
                  blocks={demoBlocks}
                  compact
                />
              </PhoneFrame>
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="border-y border-border bg-surface/40 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">Simples de propósito</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Crie. Personalize. Publique.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Sem um formulário gigante, sem código e sem precisar aprender uma ferramenta
                complicada.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Crie", "Escolha seu username e um template para começar."],
                ["02", "Personalize", "Adicione seus links e deixe cada detalhe com a sua cara."],
                ["03", "Publique", "Compartilhe sua URL e volte quando quiser para editar."],
              ].map(([number, title, text]) => (
                <article
                  key={number}
                  className="rounded-3xl border border-border bg-card p-6 shadow-soft"
                >
                  <span className="text-xs font-semibold text-primary">{number}</span>
                  <h3 className="mt-7 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-primary">Templates</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                  Comece bonito. Depois faça ser seu.
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link to="/signup">Usar um template</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {templates.slice(0, 10).map((template) => {
                const background =
                  template.theme.bgType === "gradient"
                    ? `linear-gradient(${template.theme.bgAngle}deg, ${template.theme.bgFrom}, ${template.theme.bgTo})`
                    : template.theme.bgColor;
                return (
                  <article
                    key={template.id}
                    className="group rounded-2xl border border-border bg-card p-3 transition duration-300 hover:-translate-y-1 hover:border-primary/30"
                  >
                    <div
                      className="h-40 rounded-xl transition duration-300 group-hover:scale-[1.01]"
                      style={{ background }}
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
                        <div className="h-8 w-8 rounded-full border border-white/30 bg-white/20" />
                        <div className="h-2 w-20 rounded-full bg-white/50" />
                        <div className="mt-2 h-7 w-full rounded-lg border border-white/20 bg-white/15" />
                        <div className="h-7 w-full rounded-lg border border-white/20 bg-white/15" />
                      </div>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold">{template.name}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">{template.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="recursos" className="bg-surface/35 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Recursos</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                O essencial para sua Bio representar você.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <article
                    key={resource.title}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{resource.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="precos" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">Planos</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Comece grátis e evolua quando precisar.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                A cobrança dos planos pagos ainda não está habilitada. A integração com o Asaas
                será ativada posteriormente.
              </p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`rounded-3xl border bg-card p-6 ${index === 1 ? "border-primary/50 shadow-glow" : "border-border"}`}
                >
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.text}</p>
                  <p className="mt-5 text-3xl font-bold">{plan.price}</p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-7 w-full"
                    variant={index === 0 ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/signup">{index === 0 ? "Começar grátis" : "Criar conta"}</Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-brand-2/10 p-8 text-center shadow-glow sm:p-12">
            <h2 className="text-3xl font-bold sm:text-4xl">Sua bio pode ser muito mais.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Transforme um simples link em uma página que representa você ou sua marca.
            </p>
            <Button size="lg" className="mt-7" asChild>
              <Link to="/signup">
                Criar minha Bio <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>Biofy — Sua bio. Do seu jeito.</span>
            <Link to="/terms" className="transition hover:text-foreground">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="transition hover:text-foreground">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
