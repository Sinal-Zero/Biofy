import { RotateCcw, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useBio } from "./BioContext";

type AiResult = {
  bio: string;
  linkTitles: Array<{ id: string; title: string }>;
  tips: string[];
  interactionId: string | null;
};

export function BioAiAssistant() {
  const { bundle, patchProfile, patchBlock } = useBio();
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);

  async function generate() {
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction || loading) return;

    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error("Sua sessão expirou. Entre novamente para usar a IA.");
        return;
      }

      const response = await fetch("/api/ai/bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instruction: cleanInstruction,
          previousInteractionId: interactionId,
          displayName: bundle.profile.display_name,
          bio: bundle.profile.bio,
          links: bundle.blocks
            .filter((block) => block.type !== "text" && block.type !== "image")
            .map((block) => ({ id: block.id, title: block.title, type: block.type })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (Partial<AiResult> & { error?: string })
        | null;

      if (!response.ok || !payload) {
        toast.error(payload?.error || "Não foi possível usar a IA agora.");
        return;
      }

      const nextInteractionId =
        typeof payload.interactionId === "string" ? payload.interactionId : interactionId;

      setInteractionId(nextInteractionId);
      setResult({
        bio: typeof payload.bio === "string" ? payload.bio : "",
        linkTitles: Array.isArray(payload.linkTitles) ? payload.linkTitles : [],
        tips: Array.isArray(payload.tips) ? payload.tips : [],
        interactionId: nextInteractionId,
      });
      setInstruction("");
    } catch {
      toast.error("Falha ao conectar com o Assistente Biofy.");
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setInteractionId(null);
    setResult(null);
    setInstruction("");
    toast.success("Nova conversa iniciada.");
  }

  function applyBio() {
    if (!result?.bio) return;
    patchProfile({ bio: result.bio.slice(0, 240) });
    toast.success("Descrição aplicada.");
  }

  function applyTitles() {
    if (!result?.linkTitles.length) return;
    for (const suggestion of result.linkTitles) {
      if (bundle.blocks.some((block) => block.id === suggestion.id)) {
        patchBlock(suggestion.id, { title: suggestion.title });
      }
    }
    toast.success("Títulos aplicados.");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Biofy AI</p>
              <h2 className="text-lg font-semibold text-foreground">Assistente de Bio</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Peça uma descrição melhor, títulos mais claros ou uma direção para organizar sua página.
            Você também pode continuar refinando a resposta na mesma conversa. Nada é alterado sem
            você aplicar a sugestão.
          </p>
        </div>

        {interactionId ? (
          <Button type="button" size="sm" variant="ghost" onClick={newConversation}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Nova conversa
          </Button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <textarea
          value={instruction}
          maxLength={800}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder={
            interactionId
              ? "Ex.: agora deixe mais curto e mais profissional"
              : "Ex.: deixe minha bio mais profissional e melhore os títulos dos links"
          }
          className="min-h-24 flex-1 resize-y rounded-xl border border-input bg-background/80 px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring"
        />
        <Button
          type="button"
          onClick={() => void generate()}
          disabled={loading || !instruction.trim()}
          className="sm:self-end"
        >
          <WandSparkles className="mr-2 h-4 w-4" />
          {loading ? "Criando..." : interactionId ? "Continuar" : "Gerar sugestão"}
        </Button>
      </div>

      {result ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {result.bio ? (
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descrição sugerida
              </p>
              <p className="mt-2 text-sm leading-6">{result.bio}</p>
              <Button type="button" size="sm" variant="outline" className="mt-4" onClick={applyBio}>
                Aplicar descrição
              </Button>
            </div>
          ) : null}

          {result.linkTitles.length > 0 ? (
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Títulos sugeridos
              </p>
              <div className="mt-2 space-y-1.5 text-sm">
                {result.linkTitles.map((suggestion) => (
                  <p key={suggestion.id} className="truncate">
                    {suggestion.title}
                  </p>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={applyTitles}
              >
                Aplicar títulos
              </Button>
            </div>
          ) : null}

          {result.tips.length > 0 ? (
            <div className="rounded-xl border border-border bg-background/70 p-4 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recomendações
              </p>
              <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {result.tips.map((tip) => (
                  <li key={tip} className="rounded-lg bg-accent/50 px-3 py-2">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
