import { ArrowUp, Bot } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BioTheme } from "@/lib/bio-types";
import { useBio } from "./BioContext";

type AiBlockUpdate = {
  id: string;
  title?: string;
  url?: string | null;
  isVisible?: boolean;
};

type AiNewBlock = {
  type: string;
  title?: string | null;
  url?: string | null;
};

type AiResult = {
  bio: string;
  linkTitles: Array<{ id: string; title: string }>;
  profile?: { displayName?: string };
  theme?: Partial<BioTheme>;
  blocks?: AiBlockUpdate[];
  order?: string[];
  removeBlockIds?: string[];
  duplicateBlockIds?: string[];
  addBlocks?: AiNewBlock[];
  tips: string[];
  message: string;
};

type AiErrorPayload = Partial<AiResult> & {
  error?: string;
  code?: string;
  model?: string;
  traceId?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tips?: string[];
};

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function whatsappUrlFromInstruction(instruction: string) {
  const candidates = instruction.match(/\+?\d[\d\s().-]{8,}\d/g) ?? [];
  for (const candidate of candidates) {
    let digits = candidate.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
      return `https://wa.me/${digits}`;
    }
  }
  return null;
}

export function BioAiAssistant() {
  const {
    bundle,
    theme,
    patchProfile,
    patchTheme,
    patchBlock,
    addBlock,
    duplicateBlock,
    removeBlock,
    moveBlock,
  } = useBio();
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function applyResult(payload: AiResult, sourceInstruction: string) {
    let appliedMutations = 0;
    const profilePatch: { bio?: string; display_name?: string } = {};
    const currentBio = bundle.profile.bio ?? "";

    if (typeof payload.bio === "string" && payload.bio !== currentBio) {
      profilePatch.bio = payload.bio.slice(0, 240);
    }

    const displayName = payload.profile?.displayName?.trim();
    if (displayName && displayName !== (bundle.profile.display_name ?? "")) {
      profilePatch.display_name = displayName.slice(0, 100);
    }

    if (Object.keys(profilePatch).length > 0) {
      patchProfile(profilePatch);
      appliedMutations += 1;
    }
    if (payload.theme && Object.keys(payload.theme).length > 0) {
      patchTheme(payload.theme);
      appliedMutations += 1;
    }

    const blockPatches = new Map<string, AiBlockUpdate>();
    for (const update of payload.blocks ?? []) {
      if (update?.id) blockPatches.set(update.id, update);
    }
    for (const update of payload.linkTitles ?? []) {
      if (!update?.id || !update.title) continue;
      blockPatches.set(update.id, {
        ...blockPatches.get(update.id),
        id: update.id,
        title: update.title,
      });
    }

    for (const update of blockPatches.values()) {
      const current = bundle.blocks.find((block) => block.id === update.id);
      if (!current) continue;
      patchBlock(update.id, {
        ...(typeof update.title === "string" ? { title: update.title.slice(0, 120) } : {}),
        ...(update.url !== undefined ? { url: update.url } : {}),
        ...(typeof update.isVisible === "boolean" ? { is_visible: update.isVisible } : {}),
      });
      appliedMutations += 1;
    }

    const removeSet = new Set(payload.removeBlockIds ?? []);
    const desiredOrder = (payload.order ?? []).filter((id) => !removeSet.has(id));
    desiredOrder.forEach((id, index) => moveBlock(id, index));
    if (desiredOrder.length > 0) appliedMutations += 1;

    for (const id of payload.duplicateBlockIds ?? []) {
      if (!bundle.blocks.some((block) => block.id === id)) continue;
      await duplicateBlock(id);
      appliedMutations += 1;
      await nextFrame();
    }

    for (const block of payload.addBlocks ?? []) {
      const fallbackUrl =
        block.type === "whatsapp" && !block.url
          ? whatsappUrlFromInstruction(sourceInstruction)
          : null;
      const createdId = await addBlock(block.type, {
        ...(block.title !== undefined ? { title: block.title } : {}),
        ...(block.url !== undefined ? { url: block.url } : fallbackUrl ? { url: fallbackUrl } : {}),
      });
      if (createdId) appliedMutations += 1;
      await nextFrame();
    }

    for (const id of payload.removeBlockIds ?? []) {
      if (!bundle.blocks.some((block) => block.id === id)) continue;
      await removeBlock(id);
      appliedMutations += 1;
      await nextFrame();
    }

    return appliedMutations;
  }

  async function generate() {
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction || loading) return;

    const history = messages.slice(-4).map((message) => ({
      role: message.role,
      text: message.text,
    }));
    const now = Date.now();

    setMessages((current) => [
      ...current,
      { id: `u-${now}`, role: "user", text: cleanInstruction },
    ]);
    setInstruction("");
    setLoading(true);

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
        signal: AbortSignal.timeout(35_000),
        body: JSON.stringify({
          instruction: cleanInstruction,
          history,
          displayName: bundle.profile.display_name,
          bio: bundle.profile.bio,
          theme,
          links: bundle.blocks.map((block) => ({
            id: block.id,
            title: block.title,
            type: block.type,
            isVisible: block.is_visible,
            position: block.position,
          })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as AiErrorPayload | null;
      if (!response.ok || !payload) {
        const diagnostic = [payload?.code, payload?.model].filter(Boolean).join(" · ");
        setMessages((current) => [
          ...current,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: `${payload?.error || "Não consegui concluir essa alteração agora. Tente novamente."}${diagnostic ? `\n\n${diagnostic}` : ""}`,
          },
        ]);
        return;
      }

      const normalizedPayload: AiResult = {
        bio: typeof payload.bio === "string" ? payload.bio : (bundle.profile.bio ?? ""),
        linkTitles: Array.isArray(payload.linkTitles) ? payload.linkTitles : [],
        ...(payload.profile ? { profile: payload.profile } : {}),
        ...(payload.theme ? { theme: payload.theme } : {}),
        blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
        order: Array.isArray(payload.order) ? payload.order : [],
        removeBlockIds: Array.isArray(payload.removeBlockIds) ? payload.removeBlockIds : [],
        duplicateBlockIds: Array.isArray(payload.duplicateBlockIds)
          ? payload.duplicateBlockIds
          : [],
        addBlocks: Array.isArray(payload.addBlocks) ? payload.addBlocks : [],
        tips: Array.isArray(payload.tips) ? payload.tips : [],
        message:
          typeof payload.message === "string" && payload.message.trim()
            ? payload.message.trim()
            : "Pronto. Apliquei a alteração na sua página.",
      };

      const requestedMutation =
        normalizedPayload.bio !== (bundle.profile.bio ?? "") ||
        normalizedPayload.linkTitles.length > 0 ||
        Boolean(normalizedPayload.profile && Object.keys(normalizedPayload.profile).length > 0) ||
        Boolean(normalizedPayload.theme && Object.keys(normalizedPayload.theme).length > 0) ||
        Boolean(normalizedPayload.blocks?.length) ||
        Boolean(normalizedPayload.order?.length) ||
        Boolean(normalizedPayload.removeBlockIds?.length) ||
        Boolean(normalizedPayload.duplicateBlockIds?.length) ||
        Boolean(normalizedPayload.addBlocks?.length);
      const appliedMutations = await applyResult(normalizedPayload, cleanInstruction);
      const responseText =
        requestedMutation && appliedMutations === 0
          ? "Não consegui aplicar essa alteração na sua página. Tente novamente com os dados completos."
          : normalizedPayload.message;

      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: responseText,
          tips: normalizedPayload.tips,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Não consegui conectar à Biofy AI agora. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="biofy-card flex min-h-[620px] flex-col overflow-hidden sm:min-h-[680px] xl:min-h-[760px]">
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Bot className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">Biofy AI</h2>
            <p className="truncate text-[11px] text-muted-foreground">Edite sua página por comando.</p>
          </div>
        </div>
        <span className="biofy-status">Master</span>
      </div>

      <div aria-live="polite" aria-busy={loading} className="flex flex-1 flex-col px-4 py-5 sm:px-5">
        {messages.length === 0 ? (
          <div className="max-w-sm pt-2">
            <p className="text-sm font-semibold">Diga o que você quer mudar.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              A Biofy pode ajustar texto, visual, ordem e blocos compatíveis diretamente na sua
              página.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
                {message.role === "user" ? (
                  <div className="max-w-[88%] rounded-xl bg-primary px-3.5 py-2.5 text-sm leading-6 text-primary-foreground">
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <Bot className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 max-w-[92%] text-sm leading-6 text-foreground">
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
                )}
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Bot className="h-4 w-4 text-primary" />
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-border/75 p-3 sm:p-4">
        <div className="flex items-center gap-2 rounded-[11px] border border-input/90 bg-background/55 p-1.5 transition-[border-color,background-color,box-shadow] duration-150 focus-within:border-primary/45 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10">
          <input
            value={instruction}
            maxLength={1000}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void generate();
              }
            }}
            placeholder="Peça uma alteração..."
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/55"
          />
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || !instruction.trim()}
            aria-label="Enviar mensagem"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-primary/80 bg-primary text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-primary/94 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
