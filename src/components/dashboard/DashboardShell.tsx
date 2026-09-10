import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CreditCard,
  Eye,
  LayoutDashboard,
  LogOut,
  Paintbrush,
  Settings,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useBio } from "./BioContext";

const navigation = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/dashboard/editor", label: "Minha Bio", icon: Sparkles },
  { to: "/dashboard/appearance", label: "Aparência", icon: Paintbrush },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/subscription", label: "Assinatura", icon: CreditCard },
  { to: "/dashboard/settings", label: "Configurações", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { bundle, saveState } = useBio();
  const publicUrl = bundle.profile.username ? `/${bundle.profile.username}` : null;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo ✓" : ""}
          </span>
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
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 hidden items-center justify-end lg:flex">
            <span className="min-w-20 text-right text-xs text-muted-foreground">
              {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo ✓" : ""}
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
