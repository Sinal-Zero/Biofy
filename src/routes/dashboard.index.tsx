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
import { StatsGrid } from "@/components/dashboard/StatCard";
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
    <div className="biofy-page space-y-7">
      <header className="biofy-page-header">
        <p className="biofy-page-kicker">Visão geral</p>
        <h1 className="biofy-page-title">Sua Bio</h1>
        <p className="biofy-page-description">
          O que está publicado, os principais números e os atalhos que você usa no dia a dia.
        </p>
      </header>

      <section className="biofy-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full ${username ? "bg-emerald-400" : "bg-amber-400"}`}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold">
                {username ? "Página publicada" : "Defina seu username"}
              </span>
            </div>
            <p className="mt-2 max-w-xl truncate text-sm text-muted-foreground">
              {username ? getPublicBioDisplay(username) : "Sua URL pública aparecerá aqui."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="outline" onClick={copyLink} disabled={!username}>
              <Copy className="mr-1 h-4 w-4" />
              Copiar
            </Button>
            {username ? (
              <Button variant="outline" asChild>
                <Link
                  to="/$username"
                  params={{ username }}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Abrir
                </Link>
              </Button>
            ) : null}
            <Button asChild className="col-span-2 sm:col-auto">
              <Link to="/dashboard/editor">Editar minha página</Link>
            </Button>
          </div>
        </div>
      </section>

      <StatsGrid cards={cards} />
    </div>
  );
}
