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
      <div className="biofy-card mx-auto max-w-md px-5 py-10 text-center text-sm text-muted-foreground">
        Verificando plano...
      </div>
    );
  }

  if (!isMaster) {
    return (
      <div className="biofy-page mx-auto max-w-xl py-8 sm:py-12">
        <div className="biofy-card p-7 text-center sm:p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-primary/[0.07] text-primary">
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
    <div className="biofy-page space-y-5 sm:space-y-6">
      <header className="biofy-page-header">
        <p className="biofy-page-kicker">Assistente</p>
        <h1 className="biofy-page-title">Biofy AI</h1>
        <p className="biofy-page-description">Peça uma mudança e acompanhe o resultado ao lado.</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.62fr)_minmax(560px,1.38fr)] xl:items-stretch">
        <BioAiAssistant />

        <aside className="min-w-0">
          <div className="biofy-card h-full overflow-hidden xl:min-h-[760px]">
            <div className="border-b border-border/80 bg-background/25 p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Preview</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {getPublicBioDisplay(bundle.profile.username || "sua-bio")}
                  </p>
                </div>
              </div>

              <div className="biofy-segmented mt-3">
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
                    className={`flex items-center justify-center gap-2 rounded-[0.7rem] px-3 py-2 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 ${
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

            <div className="flex min-h-[610px] items-center justify-center bg-black/[0.08] p-3 sm:min-h-[680px] sm:p-4 xl:min-h-[690px]">
              {previewMode === "mobile" ? (
                <div className="mx-auto w-full max-w-[330px]">
                  <PhoneFrame glow={false}>
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
                <div className="flex min-h-[610px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/65 bg-background/25 sm:min-h-[650px] xl:min-h-[660px]">
                  <BioPreview
                    displayName={bundle.profile.display_name}
                    username={bundle.profile.username}
                    bio={bundle.profile.bio}
                    avatarUrl={bundle.profile.avatar_url}
                    theme={theme}
                    blocks={bundle.blocks}
                    compact
                    showBranding={false}
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
