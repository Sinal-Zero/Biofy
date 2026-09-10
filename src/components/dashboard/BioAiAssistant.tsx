import { ArrowUp, Bot, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBio } from "./BioContext";

type AiResult = {
  bio: string;
  linkTitles: Array<{ id: string; title: string }>;
  tips: string[];
  message: string;
  interactionId: string | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tips?: string[];
};

export function BioAiAssistant() {
  const { bundle, patchProfile, patchBlock } = useBio();
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function generate() {
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: cleanInstruction,
    };

    setMessages((current) => [...current, userMessage]);
    setInstruction("");
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
        const errorText = payload?.error || "Não foi possível usar a IA agora.";
        setMessages((current) => [
          ...current,
          { id: `a-${Date.now()}`, role: "assistant", text: errorText },
        ]);
        return;
      }

      const nextInteractionId =
        typeof payload.interactionId === "string" ? payload.interactionId : interactionId;
      setInteractionId(nextInteractionId);

      const bio = typeof payload.bio === "string" ? payload.bio : "";
      const linkTitles = Array.isArray(payload.linkTitles) ? payload.linkTitles : [];
      const tips = Array.isArray(payload.tips) ? payload.tips : [];
      const message =
        typeof payload.message === "string" && payload.message.trim()
          ? payload.message.trim()
          : "Atualizei sua Bio com base no seu pedido.";

      if (bio && bio !== (bundle.profile.bio ?? "")) {
        patchProfile({ bio: bio.slice(0, 240) });
      }

      for (const suggestion of linkTitles) {
        const current = bundle.blocks.find((block) => block.id === suggestion.id);
        if (current && suggestion.title && current.title !== suggestion.title) {
          patchBlock(suggestion.id, { title: suggestion.title.slice(0, 120) });
        }
      }

      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: message,
          tips,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Não consegui conectar com o Gemini. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-panel xl:min-h-[780px]">
      <div className="flex items-center gap-3 border-b border-border bg-background/35 px-5 py-4 backdrop-blur-xl">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-foreground">Biofy AI</h2>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-[11px] text-muted-foreground">Editando sua página em tempo real</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[430px] items-center justify-center">
            <div className="max-w-sm text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary shadow-soft">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">O que vamos melhorar?</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Fale normalmente. Posso reescrever sua descrição, melhorar títulos e organizar a
                apresentação da Bio. As alterações aparecem no preview ao lado.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-background/70 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.tips && message.tips.length > 0 ? (
                    <div className="mt-3 space-y-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                      {message.tips.map((tip) => (
                        <p key={tip}>• {tip}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-background/70 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/35 p-4 backdrop-blur-xl sm:p-5">
        <div className="rounded-2xl border border-input bg-background shadow-soft transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
          <textarea
            value={instruction}
            maxLength={1000}
            rows={3}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void generate();
              }
            }}
            placeholder="Peça uma mudança na sua Bio..."
            className="min-h-24 w-full resize-none bg-transparent px-4 pb-2 pt-3 text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-3">
            <span className="text-[10px] text-muted-foreground">Enter envia · Shift + Enter quebra linha</span>
            <button
              type="button"
              onClick={() => void generate()}
              disabled={loading || !instruction.trim()}
              aria-label="Enviar mensagem"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
