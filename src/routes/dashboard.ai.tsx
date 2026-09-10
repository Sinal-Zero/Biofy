import { createFileRoute } from "@tanstack/react-router";
import { BioAiAssistant } from "@/components/dashboard/BioAiAssistant";

export const Route = createFileRoute("/dashboard/ai")({
  component: AiPage,
});

function AiPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Assistente</p>
        <h1 className="mt-1 text-3xl font-bold">Biofy AI</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Melhore sua descrição, títulos e organização sem perder o controle do conteúdo.
        </p>
      </div>
      <BioAiAssistant />
    </div>
  );
}
