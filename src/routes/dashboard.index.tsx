import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  MousePointerClick,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { fetchAnalytics, type AnalyticsSummary } from "@/lib/bio-data";
import { getPublicBioDisplay, getPublicBioUrl } from "@/lib/public-url";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { bundle } = useBio();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const username = bundle.profile.username;
  const activeLinks = useMemo(
    () =>
      bundle.blocks.filter(
        (block) => block.is_visible && typeof block.url === "string" && block.url.trim().length > 0,
      ).length,
    [bundle.blocks],
  );

  useEffect(() => {
    let active = true;
    void fetchAnalytics(bundle.page.id, 30)
      .then((summary) => {
        if (active) setAnalytics(summary);
      })
      .catch(() => {
        if (active) setAnalytics({ views: 0, clicks: 0, ctr: 0, topBlockId: null });
      });

    return () => {
      active = false;
    };
  }, [bundle.page.id]);

  async function copyLink() {
    if (!username) return;
    await navigator.clipboard.writeText(getPublicBioUrl(username));
    toast.success("Link copiado!");
  }

  const cards = [
    { label: "Visualizações", value: analytics?.views ?? "—", icon: BarChart3 },
    { label: "Cliques", value: analytics?.clicks ?? "—", icon: MousePointerClick },
    { label: "CTR", value: analytics ? `${analytics.ctr.toFixed(1)}%` : "—", icon: CheckCircle2 },
    { label: "Links ativos", value: activeLinks, icon: Link2 },
  ];

  return (
    <div className="space-y-6 animate-rise">
      <header>
        <p className="text-sm font-medium text-primary">Visão geral</p>
        <h1 className="mt-1 text-3xl font-bold">Sua Bio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Desempenho dos últimos 30 dias.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:border-primary/25 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${username ? "bg-emerald-400" : "bg-amber-400"}`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium">
                {username ? "Bio online" : "Defina seu username"}
              </span>
            </div>
            <p className="mt-2 truncate text-sm text-muted-foreground">
              {username ? getPublicBioDisplay(username) : "Sua URL aparecerá aqui."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink} disabled={!username}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            {username ? (
              <Button variant="outline" asChild>
                <Link to="/$username" params={{ username }} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link to="/dashboard/editor">Editar Bio</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.08] text-primary transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <strong className="mt-5 block text-3xl font-semibold tracking-tight">
                {card.value}
              </strong>
            </article>
          );
        })}
      </section>
    </div>
  );
}
