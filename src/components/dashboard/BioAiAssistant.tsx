import { ArrowUp, Bot, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function resizeComposer() {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 52), 150)}px`;
  }

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
    requestAnimationFrame(() => {
      if (composerRef.current) composerRef.current.style.height = "52px";
    });

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessages((current) => [
          ...current,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: "Sua sessão expirou. Entre novamente para continuar usando a Biofy AI.",
          },
        ]);
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
        setMessages((current) => [
          ...current,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: payload?.error || "Não consegui concluir essa alteração agora. Tente novamente.",
          },
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
          : "Pronto. Atualizei sua Bio com base no que você pediu.";

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
          text: "Não consegui conectar ao Gemini agora. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[760px] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-panel xl:min-h-[820px]">
      <div className="flex items-center gap-3 border-b border-border bg-background/40 px-4 py-3.5 backdrop-blur-xl sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] text-primary">
          <Bot className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-sm font-semibold text-foreground">Biofy AI</h2>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Converse normalmente. Eu edito a página e o preview acompanha.
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[480px] items-center justify-center">
            <div className="max-w-[310px] text-center animate-rise">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.07] text-primary shadow-soft">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">O que você quer mudar?</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pode escrever como se estivesse falando com uma pessoa. Por exemplo: “deixe minha
                bio mais profissional e encurte os títulos”.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex animate-rise items-end gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" ? (
                  <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-background/75 text-foreground shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.tips && message.tips.length > 0 ? (
                    <div className="mt-3 space-y-1.5 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
                      {message.tips.map((tip) => (
                        <p key={tip}>• {tip}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex animate-rise items-end gap-2 justify-start">
                <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-background/75 px-4 py-3 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/40 p-3.5 backdrop-blur-xl sm:p-4">
        <div className="relative rounded-[1.35rem] border border-input bg-background shadow-soft transition duration-200 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]">
          <textarea
            ref={composerRef}
            value={instruction}
            maxLength={1000}
            rows={1}
            onChange={(event) => {
              setInstruction(event.target.value);
              requestAnimationFrame(resizeComposer);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void generate();
              }
            }}
            placeholder="Peça uma alteração..."
            className="h-[52px] max-h-[150px] min-h-[52px] w-full resize-none overflow-y-auto bg-transparent py-3 pl-4 pr-14 text-sm leading-7 outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || !instruction.trim()}
            aria-label="Enviar mensagem"
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition duration-200 hover:scale-[1.04] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
