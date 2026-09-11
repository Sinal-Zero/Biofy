import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  Eye,
  LayoutDashboard,
  LogOut,
  Paintbrush,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { fetchSubscription } from "@/lib/bio-data";
import { isMasterSubscription } from "@/lib/subscription";
import { useBio } from "./BioContext";

type DashboardRoute =
  | "/dashboard"
  | "/dashboard/editor"
  | "/dashboard/ai"
  | "/dashboard/appearance"
  | "/dashboard/analytics"
  | "/dashboard/subscription";

type NavigationItem = {
  to: DashboardRoute;
  label: string;
  icon: LucideIcon;
};

const baseNavigation: NavigationItem[] = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/dashboard/editor", label: "Minha Bio", icon: Sparkles },
  { to: "/dashboard/appearance", label: "Aparência", icon: Paintbrush },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/subscription", label: "Assinatura", icon: CreditCard },
];

const aiNavigation: NavigationItem = {
  to: "/dashboard/ai",
  label: "Biofy AI",
  icon: Sparkles,
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { bundle, saveState } = useBio();
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const username = bundle.profile.username;
  const displayName = bundle.profile.display_name || username || "Minha conta";
  const initial = displayName.trim().charAt(0).toUpperCase() || "B";

  const navigation = useMemo<NavigationItem[]>(() => {
    if (!isMaster) return baseNavigation;
    return [baseNavigation[0]!, baseNavigation[1]!, aiNavigation, ...baseNavigation.slice(2)];
  }, [isMaster]);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });

    void fetchSubscription(bundle.page.user_id)
      .then((subscription) => {
        if (mounted) setIsMaster(isMasterSubscription(subscription));
      })
      .catch(() => {
        if (mounted) setIsMaster(false);
      });

    return () => {
      mounted = false;
    };
  }, [bundle.page.user_id]);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const insideMobile = mobileMenuRef.current?.contains(target);
      const insideDesktop = desktopMenuRef.current?.contains(target);
      if (!insideMobile && !insideDesktop) setProfileOpen(false);
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

  const saveLabel = saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo" : "";

  function renderProfileMenu(ref: RefObject<HTMLDivElement | null>) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          className="group flex max-w-[220px] items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-2 py-1.5 text-left shadow-sm transition-[border-color,background-color,transform] duration-200 hover:border-primary/25 hover:bg-card active:scale-[0.99]"
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          {bundle.profile.avatar_url ? (
            <img
              src={bundle.profile.avatar_url}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border/80"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/15">
              {initial}
            </span>
          )}
          <span className="hidden min-w-0 flex-1 sm:block">
            <span className="block truncate text-xs font-semibold text-foreground">
              {displayName}
            </span>
            {username ? (
              <span className="block truncate text-[10px] text-muted-foreground">@{username}</span>
            ) : null}
          </span>
          <ChevronDown
            className={`hidden h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 sm:block ${
              profileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {profileOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(16rem,calc(100vw-2rem))] origin-top-right animate-pop rounded-2xl border border-border/90 bg-popover/95 p-2 shadow-panel backdrop-blur-xl"
          >
            <div className="border-b border-border/80 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              {email ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
              ) : null}
            </div>

            <Link
              to="/dashboard/settings"
              onClick={() => setProfileOpen(false)}
              role="menuitem"
              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/75 bg-background/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-5">
          <Logo />
          <div className="flex items-center gap-2">
            {saveLabel ? (
              <span className="hidden rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground xs:block">
                {saveLabel}
              </span>
            ) : null}
            {renderProfileMenu(mobileMenuRef)}
          </div>
        </div>
        <div className="biofy-fade-edge px-1">
          <nav className="biofy-scroll-x flex gap-1 px-3 pb-3" aria-label="Navegação do painel">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/dashboard" }}
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-[background-color,border-color,color] duration-200 hover:bg-accent/60 hover:text-foreground [&.active]:border-primary/15 [&.active]:bg-primary/10 [&.active]:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-sidebar-border/70 px-6">
          <Logo />
        </div>
        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4"
          aria-label="Navegação principal"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/dashboard" }}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-[background-color,color,transform] duration-200 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground"
              >
                <span className="absolute inset-y-2 left-0 w-0.5 scale-y-0 rounded-full bg-primary transition-transform duration-200 group-[.active]:scale-y-100" />
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          {username ? (
            <Link
              to="/$username"
              params={{ username }}
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Eye className="h-4 w-4" />
              Ver minha Bio
            </Link>
          ) : null}
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1460px] px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-9 xl:px-10">
          <div className="mb-6 hidden min-h-10 items-center justify-between gap-4 lg:flex">
            <span className="min-w-20 text-xs text-muted-foreground">{saveLabel}</span>
            {renderProfileMenu(desktopMenuRef)}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
