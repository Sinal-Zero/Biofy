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
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Assistente</p>
        <h1 className="mt-1 text-3xl font-bold">Biofy AI</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Converse com a IA à esquerda e veja a página completa mudando em tempo real à direita.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(360px,0.72fr)_minmax(620px,1.28fr)] 2xl:items-start">
        <BioAiAssistant />

        <aside className="2xl:sticky 2xl:top-8 2xl:self-start">
          <div className="overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-panel">
            <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="hidden min-w-0 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-[10px] text-muted-foreground sm:block">
                  biofy.app/{bundle.profile.username || "sua-bio"}
                </div>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Preview ao vivo
              </span>
            </div>

            <div className="h-[720px] overflow-auto bg-black/20 xl:h-[780px]">
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
