import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { checkUsername, fetchMyBio, updatePage, updateProfile } from "@/lib/bio-data";
import { getPublicBioDisplay, normalizeUsername } from "@/lib/public-url";
import { getTemplate, templates } from "@/lib/templates";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  loader: async ({ context }) => {
    const bundle = await fetchMyBio(context.user.id);
    if (bundle.profile.username) throw redirect({ to: "/dashboard" });
    return bundle;
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const bundle = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const [username, setUsername] = useState("");
  const [templateId, setTemplateId] = useState("minimal");
  const [loading, setLoading] = useState(false);
  const selectedTemplate = useMemo(() => getTemplate(templateId), [templateId]);

  async function finish() {
    const normalized = normalizeUsername(username);
    if (normalized.length < 3) {
      toast.error("Use um username com pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (!(await checkUsername(normalized))) {
        toast.error("Esse username não está disponível.");
        return;
      }

      await updateProfile(user.id, { username: normalized });
      await updatePage(bundle.page.id, {
        template: selectedTemplate.id,
        theme: { ...selectedTemplate.theme },
        is_published: true,
        published_at: new Date().toISOString(),
      });
      toast.success("Sua Bio está pronta para personalizar!");
      navigate({ to: "/dashboard/editor" });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      toast.error(
        message.includes("duplicate")
          ? "Esse username acabou de ser escolhido."
          : "Não foi possível concluir agora.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto mb-8 flex max-w-[1180px] items-center justify-between gap-4">
        <Logo />
        <span className="text-xs font-medium text-muted-foreground">Configuração inicial</span>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-9 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:gap-12">
        <section className="biofy-page space-y-7 sm:space-y-8">
          <header className="biofy-page-header">
            <p className="biofy-page-kicker">Comece do seu jeito</p>
            <h1 className="biofy-page-title sm:text-4xl">Crie o endereço da sua Bio</h1>
            <p className="biofy-page-description max-w-xl">
              Escolha seu username e um visual inicial. Você pode ajustar tudo depois.
            </p>
          </header>

          <div className="biofy-card p-5 sm:p-6">
            <Label htmlFor="username">Username</Label>
            <div className="mt-2 flex min-w-0 items-center rounded-[10px] border border-input/90 bg-background/50 px-3 transition-[border-color,background-color,box-shadow] duration-150 focus-within:border-primary/45 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/12">
              <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                {getPublicBioDisplay()}
              </span>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                placeholder="seunome"
                className="min-w-20 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                maxLength={30}
                autoComplete="off"
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Use 3–30 caracteres: letras, números, ponto, hífen ou underline.
            </p>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Escolha um template</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Um ponto de partida para você continuar personalizando depois.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => {
                const active = template.id === templateId;
                const background =
                  template.theme.bgType === "gradient"
                    ? `linear-gradient(${template.theme.bgAngle}deg, ${template.theme.bgFrom}, ${template.theme.bgTo})`
                    : template.theme.bgColor;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    className={`biofy-card relative overflow-hidden p-4 text-left transition-[border-color,background-color] duration-150 ${
                      active ? "border-primary/60 bg-primary/[0.035]" : "hover:border-foreground/15"
                    }`}
                    aria-pressed={active}
                  >
                    <div
                      className="mb-4 h-20 rounded-lg border border-white/[0.06]"
                      style={{ background }}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block truncate text-sm">{template.name}</strong>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      {active ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            size="lg"
            onClick={finish}
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-44"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Criando..." : "Criar minha Bio"}
          </Button>
        </section>

        <aside className="biofy-sticky-panel hidden lg:block">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
            <span className="max-w-[220px] truncate text-[11px] text-muted-foreground">
              @{username || "seunome"}
            </span>
          </div>
          <PhoneFrame glow={false}>
            <BioPreview
              displayName={bundle.profile.display_name || user.email?.split("@")[0] || "Seu nome"}
              username={username || "seunome"}
              bio="Tudo o que importa, em um único link."
              avatarUrl={bundle.profile.avatar_url}
              theme={selectedTemplate.theme}
              blocks={[]}
              compact
            />
          </PhoneFrame>
        </aside>
      </div>
    </main>
  );
}
