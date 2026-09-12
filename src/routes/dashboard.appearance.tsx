import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Lock, Monitor, Palette, SlidersHorizontal, Smartphone, Type } from "lucide-react";
import { useEffect, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { AiPrecisionHint } from "@/components/dashboard/AiPrecisionHint";
import { useBio } from "@/components/dashboard/BioContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSubscription } from "@/lib/bio-data";
import { fontLabels, fontStacks, type FontKey } from "@/lib/bio-types";
import { templates } from "@/lib/templates";
import { isPaidSubscription } from "@/lib/subscription";

export const Route = createFileRoute("/dashboard/appearance")({
  component: AppearancePage,
});

type PreviewMode = "mobile" | "desktop";

function normalizeHex(value: string) {
  const next = value.trim();
  if (!next) return "";
  return next.startsWith("#") ? next : `#${next}`;
}

function pickerColor(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{8}$/i.test(value)) return value.slice(0, 7);
  return "#000000";
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
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
      return;
    }
    setDraft(value);
  }

  return (
    <div className="biofy-muted-panel flex items-center gap-3 p-3 transition-colors duration-200 hover:border-primary/25">
      <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 shadow-inner">
        <span className="absolute inset-0" style={{ backgroundColor: pickerColor(value) }} />
        <input
          type="color"
          value={pickerColor(value)}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Escolher ${label.toLowerCase()}`}
        />
      </label>
      <div className="min-w-0 flex-1">
        <Label>{label}</Label>
        <div className="mt-1.5 flex items-center rounded-lg border border-input bg-card px-2.5 focus-within:border-primary/40">
          <span className="text-[10px] font-semibold text-muted-foreground">HEX</span>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 7))}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-8 border-0 bg-transparent px-2 font-mono text-xs shadow-none focus-visible:ring-0"
            aria-label={`${label} em hexadecimal`}
          />
        </div>
      </div>
    </div>
  );
}

function RangeControl({
  id,
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="biofy-muted-panel p-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id}>{label}</Label>
        <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium">
          {valueLabel}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.max(min, Math.min(max, value))}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-primary"
      />
    </div>
  );
}

function PreviewToggle({
  mode,
  onChange,
}: {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}) {
  return (
    <div className="biofy-segmented">
      {(
        [
          ["mobile", Smartphone, "Celular"],
          ["desktop", Monitor, "Computador"],
        ] as const
      ).map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex items-center justify-center gap-2 rounded-[0.65rem] px-3 py-2 text-xs font-semibold transition-[background-color,color] duration-150 ${
            mode === value
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:bg-card/45 hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function AppearancePage() {
  const { bundle, theme, patchTheme, applyTemplate } = useBio();
  const [paid, setPaid] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  useEffect(() => {
    let active = true;
    void fetchSubscription(bundle.page.user_id)
      .then((subscription) => {
        if (active) setPaid(isPaidSubscription(subscription));
      })
      .catch(() => {
        if (active) setPaid(false);
      });
    return () => {
      active = false;
    };
  }, [bundle.page.user_id]);

  return (
    <div className="biofy-page space-y-6 sm:space-y-7">
      <header className="biofy-page-header">
        <p className="biofy-page-kicker">Identidade visual</p>
        <h1 className="biofy-page-title">Aparência</h1>
        <p className="biofy-page-description">Cores, tipografia e proporção da sua página.</p>
      </header>

      <AiPrecisionHint />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="space-y-5">
          {!paid ? (
            <section className="biofy-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Estilo base</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Escolha um ponto de partida.</p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  Free
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
                      className={`group rounded-xl border p-3 text-left transition-[border-color,background-color] duration-150 ${
                        active
                          ? "border-primary/60 bg-primary/[0.035]"
                          : "border-border hover:border-foreground/15"
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
                          className="absolute inset-x-4 bottom-2 top-2 rounded-lg border"
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
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="biofy-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Personalização</h2>
                <p className="mt-1 text-xs text-muted-foreground">Ajustes visuais da sua Bio.</p>
              </div>
            </div>

            {paid ? (
              <div className="mt-6 space-y-7">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Estrutura</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ColorControl
                      label="Fundo da página"
                      value={theme.pageBgColor}
                      onChange={(pageBgColor) => patchTheme({ pageBgColor })}
                    />
                    <ColorControl
                      label="Cartão central"
                      value={theme.bgColor}
                      onChange={(bgColor) => patchTheme({ bgType: "solid", bgColor })}
                    />
                    <ColorControl
                      label="Borda"
                      value={theme.panelBorderColor}
                      onChange={(panelBorderColor) => patchTheme({ panelBorderColor })}
                    />
                    <ColorControl
                      label="Texto"
                      value={theme.textColor}
                      onChange={(textColor) => patchTheme({ textColor })}
                    />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <RangeControl
                      id="border-width"
                      label="Espessura da borda"
                      valueLabel={`${theme.panelBorderWidth}px`}
                      value={theme.panelBorderWidth}
                      min={0}
                      max={6}
                      step={1}
                      onChange={(panelBorderWidth) => patchTheme({ panelBorderWidth })}
                    />
                    <RangeControl
                      id="page-width"
                      label="Largura do cartão"
                      valueLabel={`${theme.width}px`}
                      value={theme.width}
                      min={360}
                      max={620}
                      step={10}
                      onChange={(width) => patchTheme({ width })}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Botões
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ColorControl
                      label="Botão"
                      value={theme.buttonColor}
                      onChange={(buttonColor) => patchTheme({ buttonColor })}
                    />
                    <ColorControl
                      label="Texto do botão"
                      value={theme.buttonTextColor}
                      onChange={(buttonTextColor) => patchTheme({ buttonTextColor })}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                    <Type className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Tipografia</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(Object.entries(fontLabels) as Array<[FontKey, string]>).map(
                      ([key, label]) => {
                        const active = theme.font === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => patchTheme({ font: key })}
                            className={`rounded-[10px] border px-3 py-3 text-left transition-[border-color,background-color] duration-150 ${
                              active
                                ? "border-primary/60 bg-primary/[0.04]"
                                : "border-border bg-background/45 hover:border-foreground/15"
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
                      },
                    )}
                  </div>
                  <div className="mt-3">
                    <RangeControl
                      id="text-scale"
                      label="Tamanho do texto"
                      valueLabel={`${Math.round(theme.textScale * 100)}%`}
                      value={theme.textScale}
                      min={0.8}
                      max={1.35}
                      step={0.05}
                      onChange={(textScale) => patchTheme({ textScale })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Personalização completa</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Pro e Master liberam cores, bordas, fontes e proporções.
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

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <div className="biofy-card overflow-hidden">
            <div className="border-b border-border p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Preview</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    @{bundle.profile.username}
                  </p>
                </div>
              </div>
              <PreviewToggle mode={previewMode} onChange={setPreviewMode} />
            </div>

            <div className="flex min-h-[620px] items-center justify-center bg-background/30 p-3 sm:p-4">
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
                      showBranding={!paid}
                      className="min-h-full"
                    />
                  </PhoneFrame>
                </div>
              ) : (
                <div className="flex min-h-[610px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/65 bg-background/25">
                  <BioPreview
                    displayName={bundle.profile.display_name}
                    username={bundle.profile.username}
                    bio={bundle.profile.bio}
                    avatarUrl={bundle.profile.avatar_url}
                    theme={theme}
                    blocks={bundle.blocks}
                    compact
                    showBranding={!paid}
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
