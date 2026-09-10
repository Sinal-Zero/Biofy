import { createFileRoute } from "@tanstack/react-router";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { useBio } from "@/components/dashboard/BioContext";
import { ImageUploadButton } from "@/components/dashboard/ImageUploadButton";
import { Label } from "@/components/ui/label";
import {
  fontLabels,
  type AvatarShape,
  type ButtonShape,
  type ButtonStyle,
  type FontKey,
  type HoverAnim,
} from "@/lib/bio-types";
import { templates } from "@/lib/templates";

export const Route = createFileRoute("/dashboard/appearance")({
  component: AppearancePage,
});

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
        />
        <span className="w-20 text-right font-mono text-[11px] text-muted-foreground">{value}</span>
      </span>
    </label>
  );
}

function AppearancePage() {
  const { bundle, theme, patchTheme, applyTemplate } = useBio();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Identidade visual</p>
        <h1 className="mt-1 text-3xl font-bold">Aparência</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personalize fundo, cores, tipografia, botões e layout sem perder seu conteúdo.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Templates</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const background =
                  template.theme.bgType === "gradient"
                    ? `linear-gradient(${template.theme.bgAngle}deg, ${template.theme.bgFrom}, ${template.theme.bgTo})`
                    : template.theme.bgColor;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${bundle.page.template === template.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  >
                    <div className="h-16 rounded-xl" style={{ background }} />
                    <strong className="mt-3 block text-sm">{template.name}</strong>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {template.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Fundo</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  value={theme.bgType}
                  onChange={(event) =>
                    patchTheme({ bgType: event.target.value as "solid" | "gradient" | "image" })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="solid">Cor sólida</option>
                  <option value="gradient">Gradiente</option>
                  <option value="image">Imagem</option>
                </select>
              </div>
              {theme.bgType === "solid" ? (
                <ColorField
                  label="Cor de fundo"
                  value={theme.bgColor}
                  onChange={(bgColor) => patchTheme({ bgColor })}
                />
              ) : null}
              {theme.bgType === "gradient" ? (
                <>
                  <ColorField
                    label="Início"
                    value={theme.bgFrom}
                    onChange={(bgFrom) => patchTheme({ bgFrom })}
                  />
                  <ColorField
                    label="Fim"
                    value={theme.bgTo}
                    onChange={(bgTo) => patchTheme({ bgTo })}
                  />
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm">Ângulo: {theme.bgAngle}°</span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={theme.bgAngle}
                      onChange={(event) => patchTheme({ bgAngle: Number(event.target.value) })}
                      className="w-full"
                    />
                  </label>
                </>
              ) : null}
              {theme.bgType === "image" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="background-image">Imagem de fundo</Label>
                  <input
                    id="background-image"
                    value={theme.bgImage}
                    onChange={(event) => patchTheme({ bgImage: event.target.value })}
                    placeholder="https://..."
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  />
                  <ImageUploadButton
                    userId={bundle.page.user_id}
                    area="background"
                    label="Enviar fundo"
                    onUploaded={(url) => patchTheme({ bgType: "image", bgImage: url })}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Cores e tipografia</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ColorField
                label="Texto"
                value={theme.textColor}
                onChange={(textColor) => patchTheme({ textColor })}
              />
              <ColorField
                label="Texto secundário"
                value={theme.mutedColor}
                onChange={(mutedColor) => patchTheme({ mutedColor })}
              />
              <ColorField
                label="Botões"
                value={theme.buttonColor}
                onChange={(buttonColor) => patchTheme({ buttonColor })}
              />
              <ColorField
                label="Texto dos botões"
                value={theme.buttonTextColor}
                onChange={(buttonTextColor) => patchTheme({ buttonTextColor })}
              />
              <div className="space-y-2 sm:col-span-2">
                <Label>Fonte</Label>
                <select
                  value={theme.font}
                  onChange={(event) => patchTheme({ font: event.target.value as FontKey })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(fontLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Botões e layout</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estilo</Label>
                <select
                  value={theme.buttonStyle}
                  onChange={(event) =>
                    patchTheme({ buttonStyle: event.target.value as ButtonStyle })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="solid">Solid</option>
                  <option value="outline">Outline</option>
                  <option value="glass">Glass</option>
                  <option value="transparent">Transparent</option>
                  <option value="gradient">Gradient</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <select
                  value={theme.buttonShape}
                  onChange={(event) =>
                    patchTheme({ buttonShape: event.target.value as ButtonShape })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <select
                  value={theme.avatarShape}
                  onChange={(event) =>
                    patchTheme({ avatarShape: event.target.value as AvatarShape })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="circle">Círculo</option>
                  <option value="rounded">Arredondado</option>
                  <option value="square">Quadrado</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Animação</Label>
                <select
                  value={theme.hoverAnim}
                  onChange={(event) => patchTheme({ hoverAnim: event.target.value as HoverAnim })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="none">Nenhuma</option>
                  <option value="lift">Elevar</option>
                  <option value="scale">Escala</option>
                  <option value="glow">Glow</option>
                </select>
              </div>
              <label className="space-y-2">
                <span className="text-sm">Espaçamento: {theme.gap}px</span>
                <input
                  type="range"
                  min="6"
                  max="28"
                  value={theme.gap}
                  onChange={(event) => patchTheme({ gap: Number(event.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm">Avatar: {theme.avatarSize}px</span>
                <input
                  type="range"
                  min="56"
                  max="140"
                  value={theme.avatarSize}
                  onChange={(event) => patchTheme({ avatarSize: Number(event.target.value) })}
                  className="w-full"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
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
