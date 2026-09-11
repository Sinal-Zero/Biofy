import { Link, createFileRoute } from "@tanstack/react-router";
import { LockKeyhole, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { PhoneFrame } from "@/components/bio/PhoneFrame";
import { BioAiAssistant } from "@/components/dashboard/BioAiAssistant";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { fetchSubscription } from "@/lib/bio-data";
import { getPublicBioDisplay } from "@/lib/public-url";
import { isMasterSubscription } from "@/lib/subscription";

export const Route = createFileRoute("/dashboard/ai")({
  component: AiPage,
});

type PreviewMode = "mobile" | "desktop";

function AiPage() {
  const { bundle, theme } = useBio();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    let mounted = true;
    void fetchSubscription(bundle.page.user_id)
      .then((subscription) => {
        if (mounted) setIsMaster(isMasterSubscription(subscription));
      })
      .catch(() => {
        if (mounted) setIsMaster(false);
      })
      .finally(() => {
        if (mounted) setCheckingPlan(false);
      });

    return () => {
      mounted = false;
    };
  }, [bundle.page.user_id]);

  if (checkingPlan) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Verificando plano...</div>
    );
  }

  if (!isMaster) {
    return (
      <div className="mx-auto max-w-xl py-12 animate-rise">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-panel">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Biofy AI é exclusiva do Master</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            O Master libera edição da sua página por comandos em linguagem natural.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/dashboard/subscription">Ver Master</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <p className="text-sm font-medium text-primary">Assistente</p>
        <h1 className="mt-1 text-3xl font-bold">Biofy AI</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Peça uma mudança e acompanhe o resultado ao lado.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.62fr)_minmax(600px,1.38fr)] xl:items-start">
        <BioAiAssistant />

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-panel">
            <div className="border-b border-border bg-background/45 p-3 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Preview</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {getPublicBioDisplay(bundle.profile.username || "sua-bio")}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 rounded-xl border border-border bg-background/60 p-1">
                {(
                  [
                    ["mobile", Smartphone, "Celular"],
                    ["desktop", Monitor, "Computador"],
                  ] as const
                ).map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewMode(mode)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.99] ${
                      previewMode === mode
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[760px] bg-black/15 p-4 2xl:min-h-[820px]">
              {previewMode === "mobile" ? (
                <div className="mx-auto w-full max-w-[340px] animate-rise">
                  <PhoneFrame>
                    <BioPreview
                      displayName={bundle.profile.display_name}
                      username={bundle.profile.username}
                      bio={bundle.profile.bio}
                      avatarUrl={bundle.profile.avatar_url}
                      theme={theme}
                      blocks={bundle.blocks}
                      compact
                      showBranding={false}
                      className="min-h-full"
                    />
                  </PhoneFrame>
                </div>
              ) : (
                <div className="h-[760px] overflow-auto rounded-xl border border-border/70 bg-background/35 animate-rise 2xl:h-[820px]">
                  <BioPreview
                    displayName={bundle.profile.display_name}
                    username={bundle.profile.username}
                    bio={bundle.profile.bio}
                    avatarUrl={bundle.profile.avatar_url}
                    theme={theme}
                    blocks={bundle.blocks}
                    compact
                    showBranding={false}
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
