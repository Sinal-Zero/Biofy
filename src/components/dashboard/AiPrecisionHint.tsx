import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiPrecisionHint({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/[0.035] px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
        <strong className="font-semibold text-foreground">Quer um ajuste mais específico?</strong>{" "}
        Use a Biofy AI para pedir mudanças avançadas em linguagem natural, inclusive medidas exatas,
        espaçamentos e detalhes que não aparecem nos controles padrão.
      </p>
      <Link
        to="/dashboard/ai"
        className="shrink-0 text-xs font-semibold text-primary underline-offset-4 hover:underline"
      >
        Abrir Biofy AI
      </Link>
    </aside>
  );
}
