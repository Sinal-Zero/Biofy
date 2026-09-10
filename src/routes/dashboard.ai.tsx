import { createFileRoute } from "@tanstack/react-router";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
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
          Converse com a IA à esquerda e acompanhe sua página em tempo real à direita.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_420px] xl:items-start">
        <BioAiAssistant />

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">PREVIEW EM TEMPO REAL</span>
            <span className="max-w-40 truncate text-xs text-muted-foreground">
              @{bundle.profile.username}
            </span>
          </div>

          <PhoneFrame>
            <BioPreview
              displayName={bundle.profile.display_name}
              username={bundle.profile.username}
              bio={bundle.profile.bio}
              avatarUrl={bundle.profile.avatar_url}
              theme={theme}
              blocks={bundle.blocks}
              compact
            />
          </PhoneFrame>
        </aside>
      </div>
    </div>
  );
}
