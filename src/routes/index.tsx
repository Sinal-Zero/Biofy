import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  LogOut,
  Palette,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { supabase } from "@/integrations/supabase/client";
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
    title: "Visual do seu jeito",
    text: "Cores, tipografia, botões, fundo e espaçamento em um único editor.",
  },
  {
    icon: Link2,
    title: "Links organizados",
    text: "Reúna portfólio, redes e contato sem espalhar vários endereços.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "Acompanhe visualizações, cliques e CTR da sua página.",
  },
  {
    icon: Sparkles,
    title: "Biofy AI no Master",
    text: "Peça mudanças em linguagem natural e deixe a IA aplicar direto na página.",
  },
];

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    text: "Para começar",
    checkoutUrl: null,
    features: ["Até 1 página", "Username", "Links básicos", "Templates básicos"],
  },
  {
    name: "Pro",
    price: "R$ 21,90/mês",
    text: "Para crescer",
    checkoutUrl: "https://www.asaas.com/c/5a65xpt3sm57axni",
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
    checkoutUrl: "https://www.asaas.com/c/ynze63vc9bunge8g",
    features: [
      "Até 5 páginas",
      "Tudo do Pro",
      "Biofy AI",
      "Recursos profissionais",
      "Analytics avançado",
      "Base para domínio próprio",
    ],
  },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] =
    useState<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  async function signOut() {
    setProfileOpen(false);
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  }

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    (user?.user_metadata?.["name"] as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Minha conta";
  const avatarUrl =
    (user?.user_metadata?.["avatar_url"] as string | undefined) ||
    (user?.user_metadata?.["picture"] as string | undefined) ||
    null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const heroTheme =
    templates.find((template) => template.id === "dark")?.theme ?? templates[0]!.theme;

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav
            className="hidden items-center gap-1 text-sm text-muted-foreground md:flex"
            aria-label="Navegação principal"
          >
            {[
              ["#como-funciona", "Como funciona"],
              ["#templates", "Templates"],
              ["#recursos", "Recursos"],
              ["#precos", "Preços"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          {user ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="group flex h-10 items-center gap-2 rounded-full border border-border bg-card/80 p-1.5 pr-3 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-card active:scale-[0.99]"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initial}
                  </span>
                )}
                <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                  {displayName}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {profileOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-64 origin-top-right animate-pop rounded-2xl border border-border bg-popover/95 p-2 shadow-panel backdrop-blur-xl"
                >
                  <div className="border-b border-border px-3 py-3">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                          {initial}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                    role="menuitem"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Painel
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configurações
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Criar Bio</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-8 lg:pb-32">
          <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-35" />
          <div className="pointer-events-none absolute left-1/2 top-16 h-[460px] w-[min(760px,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-[130px]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="max-w-3xl animate-rise">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Mais que links. É você.
              </div>
              <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Sua bio. <span className="gradient-text">Do seu jeito.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Uma página para reunir seus links, mostrar sua identidade e compartilhar tudo em um
                só endereço.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={user ? "/dashboard/editor" : "/signup"}>
                    {user ? "Editar minha Bio" : "Criar minha Bio"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#templates">Ver templates</a>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Comece grátis
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Salvamento automático
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:100ms]">
              <div className="absolute -inset-10 rounded-full bg-brand-2/12 blur-3xl" />
              <PhoneFrame className="relative animate-float">
                <BioPreview
                  displayName="Marina Costa"
                  username="marina"
                  bio="Design, fotografia e projetos que eu gosto de criar."
                  avatarUrl={null}
                  theme={heroTheme}
                  blocks={demoBlocks}
                  compact
                />
              </PhoneFrame>
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="border-y border-border bg-surface/35 px-4 py-20 sm:px-6 lg:px-8"
        >
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">Como funciona</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Crie. Personalize. Compartilhe.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Crie", "Escolha seu username e comece com um template."],
                ["02", "Personalize", "Adicione links e ajuste o visual da página."],
                ["03", "Compartilhe", "Use um único endereço e edite quando quiser."],
              ].map(([number, title, text], index) => (
                <ScrollReveal key={number} delay={index * 70}>
                  <article className="group h-full rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25">
                    <span className="text-xs font-semibold text-primary">{number}</span>
                    <h3 className="mt-7 text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section id="templates" className="px-4 py-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-primary">Templates</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Comece com uma base limpa.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Escolha um estilo e continue personalizando dentro do editor.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to={user ? "/dashboard/appearance" : "/signup"}>Usar template</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {templates.map((template, index) => (
                <ScrollReveal key={template.id} delay={index * 70}>
                  <article className="group rounded-3xl border border-border bg-card p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                    <div
                      className="relative h-52 overflow-hidden rounded-2xl border"
                      style={{
                        backgroundColor: template.theme.pageBgColor,
                        borderColor: template.theme.panelBorderColor,
                      }}
                    >
                      <div
                        className="absolute inset-x-[14%] bottom-5 top-5 rounded-2xl border p-4 transition-transform duration-500 group-hover:scale-[1.015]"
                        style={{
                          background:
                            template.theme.bgType === "gradient"
                              ? `linear-gradient(${template.theme.bgAngle}deg, ${template.theme.bgFrom}, ${template.theme.bgTo})`
                              : template.theme.bgColor,
                          borderColor: template.theme.panelBorderColor,
                        }}
                      >
                        <div
                          className="mx-auto h-9 w-9 rounded-full"
                          style={{ backgroundColor: template.theme.textColor, opacity: 0.16 }}
                        />
                        <div
                          className="mx-auto mt-3 h-2 w-20 rounded-full"
                          style={{ backgroundColor: template.theme.textColor, opacity: 0.45 }}
                        />
                        <div
                          className="mt-5 h-8 rounded-lg border"
                          style={{ borderColor: template.theme.buttonColor, opacity: 0.7 }}
                        />
                        <div
                          className="mt-2 h-8 rounded-lg border"
                          style={{ borderColor: template.theme.buttonColor, opacity: 0.55 }}
                        />
                      </div>
                    </div>
                    <div className="px-2 pb-2 pt-4">
                      <h3 className="text-sm font-semibold">{template.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section id="recursos" className="bg-surface/30 px-4 py-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Recursos</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Tudo gira em torno da sua página.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {resources.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <ScrollReveal key={resource.title} delay={index * 55}>
                    <article className="group h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold">{resource.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {resource.text}
                      </p>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </ScrollReveal>
        </section>

        <section id="precos" className="px-4 py-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">Planos</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Comece grátis. Evolua quando precisar.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <ScrollReveal key={plan.name} delay={index * 70}>
                  <article
                    className={`relative h-full rounded-3xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 ${
                      index === 1
                        ? "border-primary/45 shadow-glow"
                        : "border-border hover:border-primary/25"
                    }`}
                  >
                    {index === 1 ? (
                      <span className="absolute right-5 top-5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                        Popular
                      </span>
                    ) : null}
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

                    {index === 0 ? (
                      <Button className="mt-7 w-full" asChild>
                        <Link to={user ? "/dashboard" : "/signup"}>Começar grátis</Link>
                      </Button>
                    ) : user && plan.checkoutUrl ? (
                      <Button className="mt-7 w-full" variant="outline" asChild>
                        <a href={plan.checkoutUrl} target="_blank" rel="noreferrer noopener">
                          Assinar {plan.name}
                        </a>
                      </Button>
                    ) : (
                      <Button className="mt-7 w-full" variant="outline" asChild>
                        <Link to="/signup">Assinar {plan.name}</Link>
                      </Button>
                    )}
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-brand-2/10 p-8 text-center shadow-glow sm:p-12">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Coloque sua bio para trabalhar por você.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Reúna sua presença digital em uma página simples de atualizar e fácil de
                compartilhar.
              </p>
              <Button size="lg" className="mt-7" asChild>
                <Link to={user ? "/dashboard/editor" : "/signup"}>
                  {user ? "Editar minha Bio" : "Criar minha Bio"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>Biofy — Sua bio. Do seu jeito.</span>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Termos
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
