import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Link2, MousePointerClick, Percent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { fetchAnalytics, type AnalyticsSummary } from "@/lib/bio-data";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { bundle } = useBio();
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchAnalytics(bundle.page.id, days)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bundle.page.id, days]);

  const topBlock = useMemo(
    () => bundle.blocks.find((block) => block.id === summary?.topBlockId) ?? null,
    [bundle.blocks, summary?.topBlockId],
  );

  const cards = [
    { label: "Visualizações", value: summary?.views ?? 0, icon: BarChart3 },
    { label: "Cliques", value: summary?.clicks ?? 0, icon: MousePointerClick },
    { label: "CTR", value: `${(summary?.ctr ?? 0).toFixed(1)}%`, icon: Percent },
    { label: "Mais acessado", value: topBlock?.title || "—", icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Dados reais</p>
          <h1 className="mt-1 text-3xl font-bold">Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Visualizações e cliques registrados na sua página publicada. Nenhum número é simulado.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((value) => (
            <Button
              key={value}
              variant={days === value ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(value)}
            >
              {value} dias
            </Button>
          ))}
        </div>
      </div>

      {!bundle.page.is_published ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-100">
          Publique sua Bio para começar a receber visualizações e cliques.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
          Não foi possível carregar os analytics agora.
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <strong className="mt-4 block truncate text-2xl font-semibold tracking-tight">
                  {loading ? "—" : card.value}
                </strong>
              </div>
            );
          })}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Como é calculado</h2>
        <div className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <p>
            <strong className="block text-foreground">Visualização</strong>Uma abertura da sua Bio
            publicada.
          </p>
          <p>
            <strong className="block text-foreground">Clique</strong>Um clique em um bloco ou link
            da página.
          </p>
          <p>
            <strong className="block text-foreground">CTR</strong>Cliques divididos por
            visualizações no período selecionado.
          </p>
        </div>
      </section>
    </div>
  );
}
