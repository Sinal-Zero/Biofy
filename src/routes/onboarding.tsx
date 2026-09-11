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
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between">
        <Logo />
        <span className="text-xs text-muted-foreground">Configuração inicial</span>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <section className="space-y-8 animate-rise">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Comece do seu jeito</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Crie o endereço da sua Bio</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Escolha seu username e um visual inicial. Você pode ajustar tudo depois.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <Label htmlFor="username">Username</Label>
            <div className="mt-2 flex items-center rounded-xl border border-input bg-background px-3 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30">
              <span className="shrink-0 text-sm text-muted-foreground">{getPublicBioDisplay()}</span>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                placeholder="seunome"
                className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                maxLength={30}
                autoComplete="off"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Use 3–30 caracteres: letras, números, ponto, hífen ou underline.
            </p>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Escolha um template</h2>
              <p className="mt-1 text-sm text-muted-foreground">Só um ponto de partida para sua página.</p>
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
                    className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.99] ${
                      active
                        ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20"
                        : "border-border hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card"
                    }`}
                  >
                    <div className="mb-4 h-20 rounded-xl shadow-inner" style={{ background }} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-sm">{template.name}</strong>
                        <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button size="lg" onClick={finish} disabled={loading} className="min-w-44">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Criando..." : "Criar minha Bio"}
          </Button>
        </section>

        <aside className="sticky top-6 hidden lg:block animate-rise">
          <PhoneFrame>
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
