import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  LayoutDashboard,
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
    title: "Identidade visual",
    text: "Ajuste cores, tipografia, botões, fundo e proporções sem perder consistência.",
  },
  {
    icon: Link2,
    title: "Links em um só lugar",
    text: "Organize portfólio, redes, contato e conteúdo em uma página fácil de compartilhar.",
  },
  {
    icon: BarChart3,
    title: "Analytics direto ao ponto",
    text: "Acompanhe visualizações, cliques e CTR sem transformar o painel em uma planilha.",
  },
  {
    icon: Sparkles,
    title: "Biofy AI",
    text: "No Master, descreva a mudança em linguagem natural e deixe a Biofy aplicar na página.",
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/94 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
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
                className="rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
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
                className="group flex h-10 items-center gap-2 rounded-[10px] border border-border/85 bg-card px-1.5 pr-2.5 text-left transition-colors duration-150 hover:border-foreground/15 hover:bg-accent/35"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                    {initial}
                  </span>
                )}
                <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                  {displayName}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {profileOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-[min(16rem,calc(100vw-2rem))] origin-top-right animate-pop rounded-xl border border-border/90 bg-popover p-2 shadow-panel"
                >
                  <div className="border-b border-border/80 px-3 py-3">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 font-semibold text-primary">
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
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent/60"
                    role="menuitem"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Painel
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent/60"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configurações
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
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
        <section className="px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:px-8 lg:pb-28">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div className="max-w-3xl biofy-page">
              <p className="biofy-section-label">Biofy para sua presença digital</p>
              <h1 className="mt-4 max-w-3xl text-[clamp(2.8rem,8vw,5rem)] font-bold leading-[0.98] tracking-[-0.05em]">
                Um link para mostrar o que realmente importa.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Reúna links, identidade, contato e conteúdo em uma página fácil de editar e pronta
                para compartilhar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" asChild>
                  <Link to={user ? "/dashboard/editor" : "/signup"}>
                    {user ? "Editar minha Bio" : "Criar Bio grátis"}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Comece no plano Free
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Salvamento automático
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Página pronta para compartilhar
                </span>
              </div>
            </div>

            <div className="biofy-product-stage mx-auto w-full max-w-[560px] p-5 sm:p-7 lg:p-8">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <p className="text-sm font-semibold">Prévia da página</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">bio-fy.vercel.app/marina</p>
                </div>
                <span className="biofy-status">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
              <PhoneFrame glow={false} className="max-w-[332px]">
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
          className="border-y border-border/70 bg-surface/22 px-4 py-20 sm:px-6 lg:px-8"
        >
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="biofy-section-label">Como funciona</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                Do zero ao link publicado em poucos passos.
              </h2>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                ["01", "Crie", "Escolha seu username e comece com uma base pronta."],
                [
                  "02",
                  "Personalize",
                  "Organize links e ajuste o visual sem quebrar a consistência.",
                ],
                [
                  "03",
                  "Compartilhe",
                  "Publique um endereço único e continue editando quando quiser.",
                ],
              ].map(([number, title, text]) => (
                <article key={number} className="border-t border-border/80 pt-5">
                  <span className="text-xs font-semibold text-muted-foreground">{number}</span>
                  <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section id="templates" className="px-4 py-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="biofy-section-label">Templates</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                  Uma base boa antes de qualquer efeito.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Escolha um estilo inicial e refine dentro do editor com a sua identidade.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to={user ? "/dashboard/appearance" : "/signup"}>Explorar templates</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {templates.map((template) => (
                <article key={template.id} className="biofy-card overflow-hidden p-3">
                  <div
                    className="relative h-52 overflow-hidden rounded-xl border border-border/70"
                    style={{
                      backgroundColor: template.theme.pageBgColor,
                      borderColor: template.theme.panelBorderColor,
                    }}
                  >
                    <div
                      className="absolute inset-x-[14%] bottom-5 top-5 rounded-xl border p-4"
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
                  <div className="px-1 pb-1 pt-4">
                    <h3 className="text-sm font-semibold">{template.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section
          id="recursos"
          className="border-y border-border/70 bg-surface/18 px-4 py-24 sm:px-6 lg:px-8"
        >
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="max-w-xl lg:sticky lg:top-28">
                <p className="biofy-section-label">Recursos</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                  Menos painel. Mais resultado na sua página.
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  O editor, o visual e os dados ficam organizados para você encontrar rápido o que
                  precisa mudar.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <article key={resource.title} className="biofy-card p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-primary" />
                        <h3 className="text-base font-semibold">{resource.title}</h3>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {resource.text}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section id="precos" className="px-4 py-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="biofy-section-label">Planos</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                Comece simples. Evolua quando fizer sentido.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                O plano Free resolve o começo. Pro e Master liberam mais personalização, dados e
                automação.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`biofy-card flex h-full flex-col p-6 ${index === 1 ? "border-primary/45" : ""}`}
                >
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.text}</p>
                    <p className="mt-5 text-3xl font-bold tracking-[-0.035em]">{plan.price}</p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3 border-t border-border/70 pt-5 text-sm">
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
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-5xl">
            <div className="biofy-card px-6 py-10 text-center sm:px-10 sm:py-14">
              <p className="biofy-section-label">Pronto para publicar</p>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                Sua presença digital pode começar com um único endereço.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                Crie a página, organize o que importa e compartilhe quando estiver pronta.
              </p>
              <Button size="lg" className="mt-7" asChild>
                <Link to={user ? "/dashboard/editor" : "/signup"}>
                  {user ? "Editar minha Bio" : "Criar Bio grátis"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <footer className="border-t border-border/70 px-4 py-8 sm:px-6 lg:px-8">
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
