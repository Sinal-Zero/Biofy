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
import { Button } from "@/components/ui/button";
import { useBio } from "@/components/dashboard/BioContext";
import { fetchAnalytics, type AnalyticsSummary } from "@/lib/bio-data";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

const PUBLIC_BASE_URL = "https://bio-fy.vercel.app";
const PUBLIC_DISPLAY_BASE = "bio-fy.vercel.app/";

function PublicAddress({ username }: { username: string }) {
  return (
    <span className="inline-flex max-w-full items-baseline text-sm text-muted-foreground">
      <span className="shrink-0 whitespace-nowrap">{PUBLIC_DISPLAY_BASE}</span>
      <span className="min-w-0 break-words font-medium text-foreground">{username}</span>
    </span>
  );
}

function DashboardOverview() {
  const { bundle } = useBio();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const activeLinks = useMemo(
    () =>
      bundle.blocks.filter(
        (block) => block.is_visible && typeof block.url === "string" && block.url.trim().length > 0,
      ).length,
    [bundle.blocks],
  );
  const publicPath = bundle.profile.username ? `/${bundle.profile.username}` : "";

  useEffect(() => {
    let active = true;
    fetchAnalytics(bundle.page.id, 30)
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
    if (!publicPath) return;
    await navigator.clipboard.writeText(`${PUBLIC_BASE_URL}${publicPath}`);
    toast.success("Link copiado!");
  }

  const cards = [
    { label: "Visualizações", value: analytics?.views ?? "—", icon: BarChart3 },
    { label: "Cliques", value: analytics?.clicks ?? "—", icon: MousePointerClick },
    { label: "CTR", value: analytics ? `${analytics.ctr.toFixed(1)}%` : "—", icon: CheckCircle2 },
    { label: "Links ativos", value: activeLinks, icon: Link2 },
  ];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-primary">Visão geral</p>
        <h1 className="mt-1 text-3xl font-bold">Sua Bio em um só lugar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe sua Bio e veja os resultados reais dos últimos 30 dias.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/20 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${bundle.profile.username ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              <span className="text-sm font-medium">
                {bundle.profile.username ? "Bio online" : "Escolha um username"}
              </span>
            </div>
            <div className="mt-2 max-w-full overflow-hidden">
              {bundle.profile.username ? (
                <PublicAddress username={bundle.profile.username} />
              ) : (
                <span className="text-sm text-muted-foreground">Escolha um username</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink} disabled={!publicPath}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar link
            </Button>
            {bundle.profile.username ? (
              <Button variant="outline" asChild>
                <Link
                  to="/$username"
                  params={{ username: bundle.profile.username }}
                  target="_blank"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visualizar
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
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/25"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <strong className="mt-4 block text-3xl font-semibold tracking-tight">
                {card.value}
              </strong>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Próximos passos</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              to="/dashboard/editor"
              className="block rounded-xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent"
            >
              <span className="font-medium">1. Monte sua Bio</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Adicione seus principais links e redes sociais.
              </span>
            </Link>
            <Link
              to="/dashboard/appearance"
              className="block rounded-xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent"
            >
              <span className="font-medium">2. Personalize o visual</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Ajuste cores, tipografia e estilo dos botões.
              </span>
            </Link>
            <Link
              to="/dashboard/analytics"
              className="block rounded-xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent"
            >
              <span className="font-medium">3. Acompanhe os resultados</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Veja quais links recebem mais cliques.
              </span>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Resumo</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Template</dt>
              <dd className="font-medium capitalize">{bundle.page.template}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Blocos</dt>
              <dd className="font-medium">{bundle.blocks.length}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-muted-foreground">Endereço</dt>
              <dd className="min-w-0 sm:max-w-[75%] sm:text-right">
                {bundle.profile.username ? (
                  <PublicAddress username={bundle.profile.username} />
                ) : (
                  <span className="text-muted-foreground">Escolha um username</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
