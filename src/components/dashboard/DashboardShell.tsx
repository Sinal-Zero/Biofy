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
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useBio } from "./BioContext";

const navigation = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/dashboard/editor", label: "Minha Bio", icon: Sparkles },
  { to: "/dashboard/appearance", label: "Aparência", icon: Paintbrush },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/subscription", label: "Assinatura", icon: CreditCard },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { bundle, saveState } = useBio();
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const publicUrl = bundle.profile.username ? `/${bundle.profile.username}` : null;
  const displayName = bundle.profile.display_name || bundle.profile.username || "Minha conta";
  const initial = displayName.trim().charAt(0).toUpperCase() || "B";

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setProfileOpen(false);
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
    navigate({ to: "/" });
  }

  const saveLabel =
    saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo ✓" : "";

  const profileMenu = (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setProfileOpen((open) => !open)}
        className="group flex max-w-[220px] items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 text-left transition hover:border-primary/25 hover:bg-accent/60"
        aria-haspopup="menu"
        aria-expanded={profileOpen}
      >
        {bundle.profile.avatar_url ? (
          <img
            src={bundle.profile.avatar_url}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/15">
            {initial}
          </span>
        )}
        <span className="hidden min-w-0 flex-1 sm:block">
          <span className="block truncate text-xs font-semibold text-foreground">{displayName}</span>
          {bundle.profile.username ? (
            <span className="block truncate text-[10px] text-muted-foreground">
              @{bundle.profile.username}
            </span>
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
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right animate-in rounded-2xl border border-border bg-popover p-2 shadow-xl fade-in zoom-in-95"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {email ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p> : null}
          </div>

          <button
            type="button"
            disabled
            className="mt-1 flex w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground opacity-60"
          >
            <Settings className="h-4 w-4" />
            <span className="flex-1 text-left">Configurações</span>
          </button>

          <button
            type="button"
            onClick={signOut}
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground xs:block">{saveLabel}</span>
            {profileMenu}
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/dashboard" }}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-accent [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-20 items-center px-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/dashboard" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-sidebar-border p-4">
          {publicUrl && (
            <Link
              to="/$username"
              params={{ username: bundle.profile.username! }}
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <Eye className="h-4 w-4" />
              Ver minha Bio
            </Link>
          )}
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
            <span className="min-w-20 text-xs text-muted-foreground">{saveLabel}</span>
            {profileMenu}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
