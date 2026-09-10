import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { useBio } from "@/components/dashboard/BioContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSubscription } from "@/lib/bio-data";
import { fontLabels, type FontKey } from "@/lib/bio-types";
import { templates } from "@/lib/templates";

export const Route = createFileRoute("/dashboard/appearance")({
  component: AppearancePage,
});

const COLOR_SWATCHES = [
  "#111827",
  "#ffffff",
  "#6d7bff",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
] as const;

function normalizeHex(value: string) {
  const next = value.trim();
  if (!next) return "";
  return next.startsWith("#") ? next : `#${next}`;
}

function BrandedColorPicker({
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
      onChange(normalized.toLowerCase());
      setDraft(normalized.toLowerCase());
    } else {
      setDraft(value);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span
          className="h-7 w-7 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-3 grid grid-cols-8 gap-2">
        {COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`aspect-square rounded-full border-2 transition hover:scale-110 ${
              value.toLowerCase() === color.toLowerCase()
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Usar cor ${color}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
        <span className="text-xs font-semibold text-primary">HEX</span>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 7))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="h-10 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus-visible:ring-0"
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
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha uma base e personalize só o que realmente importa.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Estilo base</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Três opções neutras para começar sem complicação.
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
                    className={`group rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 ${
                      active ? "border-primary ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    <div
                      className="relative h-24 overflow-hidden rounded-xl border border-black/5"
                      style={{ backgroundColor: template.theme.bgColor }}
                    >
                      <div className="absolute inset-x-4 top-4 h-3 rounded-full bg-current opacity-15" />
                      <div className="absolute inset-x-4 top-10 h-7 rounded-lg border border-current opacity-25" />
                      <div className="absolute inset-x-4 top-[4.6rem] h-2 rounded-full bg-current opacity-10" />
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
                  <h2 className="text-lg font-semibold">Personalização</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cores próprias e tipografia completa para Pro e Master.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                Pro+
              </span>
            </div>

            {hasProCustomization ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <BrandedColorPicker
                    label="Fundo"
                    value={theme.bgColor}
                    onChange={(bgColor) => patchTheme({ bgType: "solid", bgColor })}
                  />
                  <BrandedColorPicker
                    label="Texto"
                    value={theme.textColor}
                    onChange={(textColor) => patchTheme({ textColor })}
                  />
                  <BrandedColorPicker
                    label="Botão"
                    value={theme.buttonColor}
                    onChange={(buttonColor) => patchTheme({ buttonColor })}
                  />
                  <BrandedColorPicker
                    label="Texto do botão"
                    value={theme.buttonTextColor}
                    onChange={(buttonTextColor) => patchTheme({ buttonTextColor })}
                  />
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="font-select">Fonte</Label>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Todas as fontes disponíveis no Biofy.
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
                      {Object.keys(fontLabels).length} opções
                    </span>
                  </div>
                  <select
                    id="font-select"
                    value={theme.font}
                    onChange={(event) => patchTheme({ font: event.target.value as FontKey })}
                    className="mt-3 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(fontLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
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
                      No Free você usa os três estilos base e a fonte Jakarta. Pro e Master liberam
                      cores próprias e todas as fontes.
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
          <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
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
