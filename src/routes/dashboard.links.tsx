import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBlockDef, normalizeUrl } from "@/lib/blocks";

export const Route = createFileRoute("/dashboard/links")({
  component: LinksPage,
});

function LinksPage() {
  const { bundle, addBlock, patchBlock, removeBlock, moveBlock } = useBio();
  const links = bundle.blocks.filter((block) => block.type !== "text" && block.type !== "image");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Conteúdo</p>
          <h1 className="mt-1 text-3xl font-bold">Links</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gerencie, reordene, oculte ou exclua os destinos da sua Bio.</p>
        </div>
        <Button onClick={() => addBlock("link")}><Plus className="mr-2 h-4 w-4" />Novo link</Button>
      </div>

      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm font-medium">Nenhum link ainda.</p>
            <Button className="mt-4" onClick={() => addBlock("link")}>Adicionar primeiro link</Button>
          </div>
        ) : null}

        {links.map((block, index) => {
          const def = getBlockDef(block.type);
          const Icon = def.icon;
          return (
            <article key={block.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={block.title ?? def.label} onChange={(event) => patchBlock(block.id, { title: event.target.value })} placeholder="Título" />
                    <Input
                      value={block.url ?? ""}
                      onChange={(event) => patchBlock(block.id, { url: event.target.value })}
                      onBlur={(event) => patchBlock(block.id, { url: normalizeUrl(block.type, event.target.value) || null })}
                      placeholder={def.placeholder ?? "https://"}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{def.label} · posição {index + 1}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => moveBlock(block.id, Math.max(0, index - 1))} aria-label="Mover para cima"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" disabled={index === links.length - 1} onClick={() => moveBlock(block.id, Math.min(bundle.blocks.length - 1, index + 1))} aria-label="Mover para baixo"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => patchBlock(block.id, { is_visible: !block.is_visible })} aria-label={block.is_visible ? "Ocultar" : "Mostrar"}>{block.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
                  <Button variant="ghost" size="icon" onClick={() => removeBlock(block.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
