import type { LucideIcon } from "lucide-react";

export type StatCardData = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function StatsGrid({ cards, loading }: { cards: StatCardData[]; loading?: boolean }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="biofy-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{card.label}</span>
            </div>
            <strong className="mt-5 block truncate text-2xl font-semibold tracking-[-0.03em]">
              {loading ? "—" : card.value}
            </strong>
          </article>
        );
      })}
    </section>
  );
}
