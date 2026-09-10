import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Lock, Pipette, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { useBio } from "@/components/dashboard/BioContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSubscription } from "@/lib/bio-data";
import { fontLabels, fontStacks, type FontKey } from "@/lib/bio-types";
import { templates } from "@/lib/templates";

export const Route = createFileRoute("/dashboard/appearance")({
  component: AppearancePage,
});

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
    <div className="group rounded-2xl border border-border bg-background p-4 transition duration-300 hover:border-primary/30 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>{label}</Label>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{description}</p>
        </div>
        <span
          className="h-9 w-9 shrink-0 rounded-xl border border-border shadow-sm transition group-hover:scale-105"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      </div>

      <label className="relative mt-4 flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-input bg-card px-3 py-2.5 transition hover:border-primary/40">
        <span
          className="h-9 w-9 rounded-lg border border-white/10 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Pipette className="h-3.5 w-3.5 text-primary" />
            Escolher cor
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase text-muted-foreground">
            {value}
          </span>
        </span>
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Escolher ${label.toLowerCase()}`}
        />
      </label>

      <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
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
  );
}

function AppearancePage() {
  const { bundle, theme, patchTheme, applyTemplate } = useBio();
  const [plan, setPlan] = useState<string>("free");

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
      <div>
        <p className="text-sm font-medium text-primary">Identidade visual</p>
        <h1 className="mt-1 text-3xl font-bold">Aparência</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Controle a página inteira: fundo externo, caixa central, borda, texto, botões e tipografia.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Estilo base</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use uma base rápida ou personalize tudo abaixo.
                </p>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                Todos os planos
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

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Personalização completa</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sem paleta predefinida: escolha exatamente as cores que quiser.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                Pro+
              </span>
            </div>

            {hasProCustomization ? (
              <div className="mt-5 space-y-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Estrutura da página
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <BrandedColorPicker
                      label="Fundo da página"
                      description="A área externa que aparece ao redor da sua Bio no computador."
                      value={theme.pageBgColor}
                      onChange={(pageBgColor) => patchTheme({ pageBgColor })}
                    />
                    <BrandedColorPicker
                      label="Fundo da caixa central"
                      description="A superfície principal onde ficam foto, descrição e links."
                      value={theme.bgColor}
                      onChange={(bgColor) => patchTheme({ bgType: "solid", bgColor })}
                    />
                    <BrandedColorPicker
                      label="Borda da caixa"
                      description="Define o contorno da área central da sua Bio."
                      value={theme.panelBorderColor}
                      onChange={(panelBorderColor) => patchTheme({ panelBorderColor })}
                    />
                    <BrandedColorPicker
                      label="Texto"
                      description="Cor principal para nome, ícones e informações em destaque."
                      value={theme.textColor}
                      onChange={(textColor) => patchTheme({ textColor })}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Botões
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <BrandedColorPicker
                      label="Botão"
                      description="Cor principal dos botões e links da página."
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

                <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Tipografia</Label>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Veja a aparência da fonte antes de aplicar.
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
                      {Object.keys(fontLabels).length} fontes
                    </span>
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
                            Biofy
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                            {label}
                          </span>
                        </button>
                      );
                    })}
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
                    <p className="text-sm font-semibold">Personalização avançada bloqueada</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      No Free você usa os estilos base. Pro e Master liberam cores livres, borda,
                      fundo externo e toda a biblioteca de fontes.
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
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Preview no computador</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Atualização em tempo real</p>
              </div>
              <span className="max-w-44 truncate text-xs text-muted-foreground">
                @{bundle.profile.username}
              </span>
            </div>
            <div className="h-[640px] overflow-auto bg-black/20">
              <BioPreview
                displayName={bundle.profile.display_name}
                username={bundle.profile.username}
                bio={bundle.profile.bio}
                avatarUrl={bundle.profile.avatar_url}
                theme={theme}
                blocks={bundle.blocks}
                compact
                className="min-h-full"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
