import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Link2, MousePointerClick, Percent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBio } from "@/components/dashboard/BioContext";
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
    <div className="space-y-6 animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Desempenho</p>
          <h1 className="mt-1 text-3xl font-bold">Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">Visualizações e cliques da sua Bio.</p>
        </div>

        <div className="inline-flex w-fit rounded-xl border border-border bg-card p-1 shadow-sm">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                days === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {value} dias
            </button>
          ))}
        </div>
      </header>

      {!bundle.page.is_published ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
          Sua Bio precisa estar online para registrar acessos.
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
              <article
                key={card.label}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <strong className="mt-5 block truncate text-2xl font-semibold tracking-tight">
                  {loading ? "—" : card.value}
                </strong>
              </article>
            );
          })}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        CTR = cliques ÷ visualizações no período selecionado.
      </p>
    </div>
  );
}
