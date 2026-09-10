import { createFileRoute } from "@tanstack/react-router";
import { BioPreview } from "@/components/bio/BioPreview";
import { BioAiAssistant } from "@/components/dashboard/BioAiAssistant";
import { useBio } from "@/components/dashboard/BioContext";

export const Route = createFileRoute("/dashboard/ai")({
  component: AiPage,
});

function AiPage() {
  const { bundle, theme } = useBio();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-primary">Assistente</p>
        <h1 className="text-3xl font-bold">Biofy AI</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Peça mudanças à esquerda e acompanhe a página completa sendo atualizada ao vivo.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.62fr)_minmax(600px,1.38fr)] xl:items-start">
        <BioAiAssistant />

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-panel transition duration-300">
            <div className="flex items-center justify-between border-b border-border bg-background/45 px-4 py-3 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="min-w-0 rounded-lg border border-border bg-background/70 px-3 py-1.5 text-[10px] text-muted-foreground">
                  <span className="block truncate">biofy.app/{bundle.profile.username || "sua-bio"}</span>
                </div>
              </div>
              <span className="ml-3 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Ao vivo
              </span>
            </div>

            <div className="h-[760px] overflow-auto bg-black/20 2xl:h-[820px]">
              <BioPreview
                displayName={bundle.profile.display_name}
                username={bundle.profile.username}
                bio={bundle.profile.bio}
                avatarUrl={bundle.profile.avatar_url}
                theme={theme}
                blocks={bundle.blocks}
                compact
                className="min-h-full"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
