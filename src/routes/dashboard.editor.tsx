import { createFileRoute } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blockTypes, getBlockDef, normalizeUrl } from "@/lib/blocks";

export const Route = createFileRoute("/dashboard/editor")({
  component: BioEditor,
});

function BioEditor() {
  const {
    bundle,
    theme,
    patchProfile,
    addBlock,
    patchBlock,
    duplicateBlock,
    removeBlock,
    moveBlock,
  } = useBio();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Editor visual</p>
        <h1 className="mt-1 text-3xl font-bold">Minha Bio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edite conteúdo e links. As alterações aparecem no preview e são salvas automaticamente.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
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
                <Label htmlFor="avatar-url">Avatar</Label>
                <Input
                  id="avatar-url"
                  value={bundle.profile.avatar_url ?? ""}
                  onChange={(event) => patchProfile({ avatar_url: event.target.value || null })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Descrição</Label>
                <textarea
                  id="bio"
                  value={bundle.profile.bio ?? ""}
                  maxLength={240}
                  onChange={(event) => patchProfile({ bio: event.target.value })}
                  placeholder="Conte em poucas palavras quem você é."
                  className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Adicionar bloco</h2>
                <p className="mt-1 text-xs text-muted-foreground">Links, texto, imagem e redes sociais.</p>
              </div>
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {blockTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => addBlock(type.type)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent"
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            {bundle.blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <p className="text-sm font-medium">Você ainda não possui blocos.</p>
                <p className="mt-1 text-xs text-muted-foreground">Adicione seu primeiro link para começar.</p>
              </div>
            ) : null}

            {bundle.blocks.map((block, index) => {
              const def = getBlockDef(block.type);
              const Icon = def.icon;
              return (
                <article
                  key={block.id}
                  draggable
                  onDragStart={() => setDraggedId(block.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedId && draggedId !== block.id) moveBlock(draggedId, index);
                    setDraggedId(null);
                  }}
                  className={`rounded-2xl border bg-card p-4 transition ${draggedId === block.id ? "border-primary/60 opacity-60" : "border-border"}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-[11px] text-muted-foreground">Arraste para reordenar</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => patchBlock(block.id, { is_visible: !block.is_visible })}
                      aria-label={block.is_visible ? "Ocultar" : "Mostrar"}
                    >
                      {block.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => duplicateBlock(block.id)} aria-label="Duplicar">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(block.id)} aria-label="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {block.type === "text" ? (
                      <div className="sm:col-span-2">
                        <Label>Texto</Label>
                        <textarea
                          value={block.config.text ?? ""}
                          onChange={(event) => patchBlock(block.id, { config: { text: event.target.value } })}
                          className="mt-2 min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Escreva algo sobre você"
                        />
                      </div>
                    ) : block.type === "image" ? (
                      <div className="sm:col-span-2">
                        <Label>URL da imagem</Label>
                        <Input
                          className="mt-2"
                          value={block.config.imageUrl ?? ""}
                          onChange={(event) => patchBlock(block.id, { config: { imageUrl: event.target.value } })}
                          placeholder="https://..."
                        />
                      </div>
                    ) : (
                      <>
                        {!def.social ? (
                          <div>
                            <Label>Título</Label>
                            <Input
                              className="mt-2"
                              value={block.title ?? ""}
                              onChange={(event) => patchBlock(block.id, { title: event.target.value })}
                              placeholder="Nome do link"
                            />
                          </div>
                        ) : null}
                        <div className={def.social ? "sm:col-span-2" : ""}>
                          <Label>{def.social ? `${def.label} — URL` : "URL"}</Label>
                          <Input
                            className="mt-2"
                            value={block.url ?? ""}
                            onChange={(event) => patchBlock(block.id, { url: event.target.value })}
                            onBlur={(event) => {
                              const normalized = normalizeUrl(block.type, event.target.value);
                              if (normalized !== event.target.value) patchBlock(block.id, { url: normalized });
                            }}
                            placeholder={def.placeholder ?? "https://"}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">PREVIEW EM TEMPO REAL</span>
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
