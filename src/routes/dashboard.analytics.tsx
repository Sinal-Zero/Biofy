import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Link2, MousePointerClick, Percent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBio } from "@/components/dashboard/BioContext";
import { StatsGrid } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

    void fetchAnalytics(bundle.page.id, days)
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
    <div className="biofy-page space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="biofy-page-header">
          <p className="biofy-page-kicker">Desempenho</p>
          <h1 className="biofy-page-title">Analytics</h1>
          <p className="biofy-page-description">
            Os números essenciais para entender como sua página está sendo usada.
          </p>
        </div>

        <div className="biofy-segmented w-full sm:w-auto sm:min-w-[250px]">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition-[background-color,color] duration-150 ${
                days === value
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
              }`}
            >
              {value} dias
            </button>
          ))}
        </div>
      </header>

      {!bundle.page.is_published ? (
        <Alert className="border-amber-400/20 bg-amber-400/[0.05] text-amber-100">
          <AlertDescription>Sua Bio precisa estar online para registrar acessos.</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar os analytics agora.</AlertDescription>
        </Alert>
      ) : (
        <StatsGrid cards={cards} loading={loading} />
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        CTR é a relação entre cliques e visualizações no período selecionado.
      </p>
    </div>
  );
}
