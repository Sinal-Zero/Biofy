import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Globe2, GripVertical, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { useBio } from "@/components/dashboard/BioContext";
import { ImageUploadButton } from "@/components/dashboard/ImageUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWhatsAppUrl, detectLinkType, getBlockDef, normalizeUrl } from "@/lib/blocks";
import type { BioBlock } from "@/lib/bio-types";

export const Route = createFileRoute("/dashboard/editor")({
  component: BioEditor,
});

const BRAZIL_DDDS = [
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "21",
  "22",
  "24",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "49",
  "51",
  "53",
  "54",
  "55",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "71",
  "73",
  "74",
  "75",
  "77",
  "79",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
] as const;

function parseWhatsAppUrl(raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(normalizeUrl("link", raw));
    let digits = "";
    if (url.hostname.replace(/^www\./, "") === "wa.me") {
      digits = url.pathname.replace(/\D/g, "");
    } else {
      digits = url.searchParams.get("phone")?.replace(/\D/g, "") ?? "";
    }
    if (!digits) return null;
    const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;
    if (withoutCountry.length < 10) return null;
    return {
      countryCode: "55",
      areaCode: withoutCountry.slice(0, 2),
      phoneNumber: withoutCountry.slice(2),
    };
  } catch {
    return null;
  }
}

function isLinkBlock(block: BioBlock) {
  return block.type !== "text" && block.type !== "image";
}

function BioEditor() {
  const { bundle, theme, patchProfile, addBlock, patchBlock, removeBlock, moveBlock } = useBio();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [openDddId, setOpenDddId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const starterCreating = useRef(false);
  const bioLength = (bundle.profile.bio ?? "").length;
  const links = useMemo(() => bundle.blocks.filter(isLinkBlock), [bundle.blocks]);

  useEffect(() => {
    if (links.length > 0 || starterCreating.current) return;
    starterCreating.current = true;
    void addBlock("link").finally(() => {
      starterCreating.current = false;
    });
  }, [addBlock, links.length]);

  function updateSmartUrl(block: BioBlock, raw: string) {
    const normalized = normalizeUrl("link", raw);
    const detectedType = detectLinkType(normalized);
    const whatsapp = detectedType === "whatsapp" ? parseWhatsAppUrl(normalized) : null;

    patchBlock(block.id, {
      type: detectedType,
      url: normalized || null,
      ...(whatsapp ? { config: whatsapp } : {}),
    });
  }

  function updateWhatsapp(block: BioBlock, patch: { areaCode?: string; phoneNumber?: string }) {
    const areaCode = patch.areaCode ?? block.config.areaCode ?? "11";
    const phoneNumber = patch.phoneNumber ?? block.config.phoneNumber ?? "";
    const url = createWhatsAppUrl("55", areaCode, phoneNumber);
    patchBlock(block.id, {
      type: "whatsapp",
      url: url || null,
      config: {
        countryCode: "55",
        areaCode,
        phoneNumber,
      },
    });
  }

  async function addLink(type: "url" | "phone") {
    setAddMenuOpen(false);
    await addBlock(type === "phone" ? "whatsapp" : "link");
  }

  return (
    <div className="biofy-page space-y-6 sm:space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="biofy-page-header">
          <p className="biofy-page-kicker">Editor</p>
          <h1 className="biofy-page-title">Minha Bio</h1>
        </div>
        <div className="biofy-status w-fit">
          {links.length} {links.length === 1 ? "link" : "links"}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="biofy-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Perfil</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display-name">Nome</Label>
                <Input
                  id="display-name"
                  value={bundle.profile.display_name ?? ""}
                  maxLength={60}
                  onChange={(event) => patchProfile({ display_name: event.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Foto</Label>
                <ImageUploadButton
                  userId={bundle.page.user_id}
                  area="avatar"
                  label="Escolher foto"
                  onUploaded={(url) => patchProfile({ avatar_url: url })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="bio">Descrição</Label>
                  <span className="text-[11px] text-muted-foreground">{bioLength}/240</span>
                </div>
                <textarea
                  id="bio"
                  value={bundle.profile.bio ?? ""}
                  maxLength={240}
                  onChange={(event) => patchProfile({ bio: event.target.value })}
                  placeholder="Sua descrição"
                  className="min-h-24 w-full resize-y rounded-[10px] border border-input/90 bg-background/50 px-3 py-2 text-sm outline-none transition-[border-color,background-color,box-shadow] duration-150 focus:border-primary/45 focus:bg-background focus:ring-2 focus:ring-ring/12"
                />
              </div>
            </div>
          </section>

          <section className="biofy-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Links</h2>
              <div className="relative">
                {blocks.length > 0 ? (
                    <Button
                      size="sm"
                      onClick={() => setAddMenuOpen((open) => !open)}
                      className="w-full mt-4 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar bloco
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setAddMenuOpen((open) => !open)}
                      className="w-full mt-4 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar primeiro bloco
                    </Button>
                  )}
                {addMenuOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-48 origin-top-right animate-pop rounded-xl border border-border/90 bg-popover p-2 shadow-panel">
                    <button
                      type="button"
                      onClick={() => void addLink("url")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent"
                    >
                      <Globe2 className="h-4 w-4 text-primary" />
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => void addLink("phone")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      Telefone
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {links.map((block) => {
                const actualIndex = bundle.blocks.findIndex((item) => item.id === block.id);
                const liveDetected = detectLinkType(block.url ?? "");
                const visualType = liveDetected === "link" ? block.type : liveDetected;
                const def = getBlockDef(visualType);
                const Icon = def.icon;
                const isWhatsapp = block.type === "whatsapp";
                const ddd = block.config.areaCode ?? "11";
                const phone = block.config.phoneNumber ?? "";
                const isCustomDdd =
                  ddd !== "" && !BRAZIL_DDDS.includes(ddd as (typeof BRAZIL_DDDS)[number]);

                return (
                  <article
                    key={block.id}
                    draggable
                    onDragStart={() => setDraggedId(block.id)}
                    onDragEnd={() => setDraggedId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedId && draggedId !== block.id) moveBlock(draggedId, actualIndex);
                      setDraggedId(null);
                    }}
                    className={`biofy-muted-panel p-4 transition-[border-color,background-color,transform] duration-200 hover:border-primary/30 ${
                      draggedId === block.id
                        ? "scale-[0.99] border-primary/60 opacity-60"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/45 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {block.title || "Novo link"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {def.label === "Link" ? "URL" : def.label}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => patchBlock(block.id, { is_visible: !block.is_visible })}
                        aria-label={block.is_visible ? "Ocultar" : "Mostrar"}
                      >
                        {block.is_visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(block.id)}
                        aria-label="Excluir"
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={block.title ?? ""}
                          onChange={(event) => patchBlock(block.id, { title: event.target.value })}
                          placeholder="Título do link"
                        />
                      </div>

                      {isWhatsapp ? (
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <div className="grid grid-cols-[92px_1fr] gap-2">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenDddId(openDddId === block.id ? null : block.id)
                                }
                                className="flex h-10 w-full items-center justify-center rounded-[10px] border border-input/90 bg-background/50 text-sm font-medium transition-colors duration-150 hover:border-foreground/18"
                              >
                                +55 {ddd || "DDD"}
                              </button>
                              {openDddId === block.id ? (
                                <div className="absolute left-0 top-12 z-30 w-[min(280px,calc(100vw-3.5rem))] rounded-xl border border-border/90 bg-popover p-3 shadow-panel">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold">DDD</span>
                                    <span className="text-[10px] font-medium text-primary">
                                      BIOFY
                                    </span>
                                  </div>
                                  <div className="grid max-h-52 grid-cols-6 gap-1.5 overflow-y-auto pr-1">
                                    {BRAZIL_DDDS.map((code) => (
                                      <button
                                        key={code}
                                        type="button"
                                        onClick={() => {
                                          updateWhatsapp(block, { areaCode: code });
                                          setOpenDddId(null);
                                        }}
                                        className={`rounded-lg px-2 py-2 text-xs transition hover:bg-primary hover:text-primary-foreground ${
                                          ddd === code
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-accent"
                                        }`}
                                      >
                                        {code}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => updateWhatsapp(block, { areaCode: "" })}
                                      className="col-span-6 rounded-lg border border-dashed border-border px-2 py-2 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                                    >
                                      Outro DDD
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <Input
                              inputMode="numeric"
                              value={phone}
                              maxLength={9}
                              onChange={(event) =>
                                updateWhatsapp(block, {
                                  phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 9),
                                })
                              }
                              placeholder="999999999"
                            />
                          </div>
                          {ddd === "" || isCustomDdd ? (
                            <Input
                              inputMode="numeric"
                              value={ddd}
                              maxLength={2}
                              onChange={(event) =>
                                updateWhatsapp(block, {
                                  areaCode: event.target.value.replace(/\D/g, "").slice(0, 2),
                                })
                              }
                              placeholder="DDD"
                            />
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>URL</Label>
                          <Input
                            value={block.url ?? ""}
                            onChange={(event) => patchBlock(block.id, { url: event.target.value })}
                            onBlur={(event) => updateSmartUrl(block, event.target.value)}
                            placeholder="https://"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <div className="biofy-card mb-3 flex items-center justify-between px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">PREVIEW</span>
            <span className="text-xs text-muted-foreground">@{bundle.profile.username}</span>
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
