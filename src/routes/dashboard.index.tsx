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

function DashboardOverview() {
  const { bundle } = useBio();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const activeLinks = useMemo(
    () => bundle.blocks.filter((block) => block.is_visible).length,
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
    const url = `${window.location.origin}${publicPath}`;
    await navigator.clipboard.writeText(url);
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
          Acompanhe o status, publique mudanças e veja os resultados reais dos últimos 30 dias.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${bundle.page.is_published ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              <span className="text-sm font-medium">
                {bundle.page.is_published ? "Publicada" : "Ainda não publicada"}
              </span>
            </div>
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {publicPath
                ? `${typeof window !== "undefined" ? window.location.origin : ""}${publicPath}`
                : "Escolha um username"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink} disabled={!publicPath}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar link
            </Button>
            {bundle.profile.username && bundle.page.is_published ? (
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
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
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
              className="block rounded-xl border border-border p-4 transition hover:bg-accent"
            >
              Adicione seus principais links e redes sociais
            </Link>
            <Link
              to="/dashboard/appearance"
              className="block rounded-xl border border-border p-4 transition hover:bg-accent"
            >
              Ajuste cores, tipografia e estilo dos botões
            </Link>
            <Link
              to="/dashboard/analytics"
              className="block rounded-xl border border-border p-4 transition hover:bg-accent"
            >
              Veja quais links recebem mais cliques
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
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Última publicação</dt>
              <dd className="font-medium">
                {bundle.page.published_at
                  ? new Date(bundle.page.published_at).toLocaleDateString("pt-BR")
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
