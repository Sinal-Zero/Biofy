import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Lock, Monitor, Pipette, SlidersHorizontal, Smartphone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { useBio } from "@/components/dashboard/BioContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSubscription } from "@/lib/bio-data";
import { fontLabels, fontStacks, type FontKey } from "@/lib/bio-types";
import { templates } from "@/lib/templates";

export const Route = createFileRoute("/dashboard/appearance")({
  component: AppearancePage,
});

type PreviewMode = "mobile" | "desktop";

function normalizeHex(value: string) {
  const next = value.trim();
  if (!next) return "";
  return next.startsWith("#") ? next : `#${next}`;
}

function BrandedColorPicker({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  function commit() {
    const normalized = normalizeHex(draft);
    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
      const clean = normalized.toLowerCase();
      onChange(clean);
      setDraft(clean);
    } else {
      setDraft(value);
    }
  }

  const pickerValue = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-background/70 transition duration-300 hover:border-primary/30 hover:shadow-soft">
      <div className="relative h-24 overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${value}, color-mix(in srgb, ${value} 72%, white), color-mix(in srgb, ${value} 68%, black))`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_40%)]" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md">
          <Pipette className="h-3.5 w-3.5" />
          {value.toUpperCase()}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label>{label}</Label>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{description}</p>
          </div>
          <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-card transition hover:scale-105 hover:border-primary/40">
            <span className="h-5 w-5 rounded-md border border-white/10" style={{ backgroundColor: value }} />
            <input
              type="color"
              value={pickerValue}
              onChange={(event) => onChange(event.target.value.toLowerCase())}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={`Escolher ${label.toLowerCase()}`}
            />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-input bg-card px-3 transition focus-within:border-primary/50">
          <span className="text-[10px] font-semibold tracking-wide text-primary">HEX</span>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 7))}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-9 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus-visible:ring-0"
            aria-label={`${label} em hexadecimal`}
          />
        </div>
      </div>
    </div>
  );
}

function AppearancePage() {
  const { bundle, theme, patchTheme, applyTemplate } = useBio();
  const [plan, setPlan] = useState<string>("free");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  useEffect(() => {
    let active = true;
    fetchSubscription(bundle.page.user_id)
      .then((subscription) => {
        if (active) setPlan(subscription?.plan ?? "free");
      })
      .catch(() => {
        if (active) setPlan("free");
      });
    return () => {
      active = false;
    };
  }, [bundle.page.user_id]);

  const hasProCustomization = plan === "pro" || plan === "business";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Identidade visual</p>
        <h1 className="text-3xl font-bold">Aparência</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Ajuste cores, tipografia e estrutura visual da sua página com uma visualização limpa ao lado.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_560px]">
        <div className="space-y-5">
          {!hasProCustomization ? (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Estilo base</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha um visual pronto para começar.
                  </p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  Plano Free
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {templates.map((template) => {
                  const active = bundle.page.template === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={`group rounded-2xl border p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 ${
                        active ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                    >
                      <div
                        className="relative h-24 overflow-hidden rounded-xl border"
                        style={{
                          backgroundColor: template.theme.pageBgColor,
                          borderColor: template.theme.panelBorderColor,
                        }}
                      >
                        <div
                          className="absolute inset-3 rounded-lg border"
                          style={{
                            backgroundColor: template.theme.bgColor,
                            borderColor: template.theme.panelBorderColor,
                          }}
                        >
                          <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-current opacity-15" />
                          <div className="absolute inset-x-3 top-8 h-6 rounded-md border border-current opacity-25" />
                        </div>
                        {active ? (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                      <strong className="mt-3 block text-sm">{template.name}</strong>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {template.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.08] text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Personalização</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Monte o visual do seu jeito, sem paletas fixas ou combinações obrigatórias.
                </p>
              </div>
            </div>

            {hasProCustomization ? (
              <div className="mt-6 space-y-7">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Estrutura
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <BrandedColorPicker
                      label="Fundo da página"
                      description="Cor da área externa ao redor da caixa principal."
                      value={theme.pageBgColor}
                      onChange={(pageBgColor) => patchTheme({ pageBgColor })}
                    />
                    <BrandedColorPicker
                      label="Caixa principal"
                      description="Cor da superfície que contém seu perfil e links."
                      value={theme.bgColor}
                      onChange={(bgColor) => patchTheme({ bgType: "solid", bgColor })}
                    />
                    <BrandedColorPicker
                      label="Borda"
                      description="Cor do contorno da caixa principal."
                      value={theme.panelBorderColor}
                      onChange={(panelBorderColor) => patchTheme({ panelBorderColor })}
                    />
                    <BrandedColorPicker
                      label="Texto"
                      description="Cor principal para nome, ícones e destaques."
                      value={theme.textColor}
                      onChange={(textColor) => patchTheme({ textColor })}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="border-width">Espessura da borda</Label>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Deixe a caixa mais discreta ou mais marcada.
                        </p>
                      </div>
                      <span className="min-w-12 rounded-lg border border-border bg-card px-2 py-1 text-center text-xs font-medium">
                        {theme.panelBorderWidth}px
                      </span>
                    </div>
                    <input
                      id="border-width"
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      value={theme.panelBorderWidth}
                      onChange={(event) => patchTheme({ panelBorderWidth: Number(event.target.value) })}
                      className="mt-4 w-full accent-primary"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Botões
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <BrandedColorPicker
                      label="Cor do botão"
                      description="Cor principal dos links e botões da página."
                      value={theme.buttonColor}
                      onChange={(buttonColor) => patchTheme({ buttonColor })}
                    />
                    <BrandedColorPicker
                      label="Texto do botão"
                      description="Cor do texto e dos ícones dentro dos botões."
                      value={theme.buttonTextColor}
                      onChange={(buttonTextColor) => patchTheme({ buttonTextColor })}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4 sm:p-5">
                  <div>
                    <Label>Tipografia</Label>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Escolha a fonte olhando o resultado, sem lista técnica ou contagem de opções.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(Object.entries(fontLabels) as Array<[FontKey, string]>).map(([key, label]) => {
                      const active = theme.font === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => patchTheme({ font: key })}
                          className={`rounded-xl border px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 ${
                            active
                              ? "border-primary bg-primary/[0.06] ring-2 ring-primary/15"
                              : "border-border bg-card"
                          }`}
                          aria-pressed={active}
                        >
                          <span
                            className="block truncate text-lg text-foreground"
                            style={{ fontFamily: fontStacks[key] }}
                          >
                            Aa Biofy
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 border-t border-border pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="text-scale">Tamanho do texto</Label>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Ajusta nome, descrição, títulos e textos dos botões.
                        </p>
                      </div>
                      <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium">
                        {Math.round(theme.textScale * 100)}%
                      </span>
                    </div>
                    <input
                      id="text-scale"
                      type="range"
                      min="0.8"
                      max="1.35"
                      step="0.05"
                      value={theme.textScale}
                      onChange={(event) => patchTheme({ textScale: Number(event.target.value) })}
                      className="mt-4 w-full accent-primary"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Lock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Personalização completa</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Pro e Master liberam cores livres, bordas, tipografia e tamanho de texto.
                    </p>
                    <Link
                      to="/dashboard/subscription"
                      className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                    >
                      Ver planos
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="2xl:sticky 2xl:top-8 2xl:self-start">
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-panel">
            <div className="border-b border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Visualizar alterações</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Confira sua página antes de sair.
                  </p>
                </div>
                <span className="max-w-44 truncate text-xs text-muted-foreground">
                  @{bundle.profile.username}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 rounded-xl border border-border bg-background/55 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    previewMode === "mobile"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Celular
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    previewMode === "desktop"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  Computador
                </button>
              </div>
            </div>

            <div className="min-h-[650px] bg-black/20 p-4">
              {previewMode === "mobile" ? (
                <div className="mx-auto w-full max-w-[330px] animate-rise">
                  <PhoneFrame>
                    <BioPreview
                      displayName={bundle.profile.display_name}
                      username={bundle.profile.username}
                      bio={bundle.profile.bio}
                      avatarUrl={bundle.profile.avatar_url}
                      theme={theme}
                      blocks={bundle.blocks}
                      compact
                      showBranding={!hasProCustomization}
                      className="min-h-full"
                    />
                  </PhoneFrame>
                </div>
              ) : (
                <div className="h-[650px] overflow-auto rounded-xl border border-border/70 bg-background/40 animate-rise">
                  <BioPreview
                    displayName={bundle.profile.display_name}
                    username={bundle.profile.username}
                    bio={bundle.profile.bio}
                    avatarUrl={bundle.profile.avatar_url}
                    theme={theme}
                    blocks={bundle.blocks}
                    compact
                    showBranding={!hasProCustomization}
                    className="min-h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
