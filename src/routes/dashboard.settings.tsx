import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { checkUsername, updatePage, updateProfile } from "@/lib/bio-data";
import { getPublicBioDisplay, normalizeUsername } from "@/lib/public-url";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { bundle, refresh } = useBio();
  const [username, setUsername] = useState(bundle.profile.username ?? "");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function saveUsername() {
    const normalized = normalizeUsername(username);
    if (normalized.length < 3) {
      toast.error("Use pelo menos 3 caracteres.");
      return;
    }

    setSaving(true);
    try {
      if (normalized !== bundle.profile.username) {
        if (!(await checkUsername(normalized))) {
          toast.error("Esse username não está disponível.");
          return;
        }
        await updateProfile(bundle.profile.id, { username: normalized });
      }

      await updatePage(bundle.page.id, {
        is_published: true,
        published_at: bundle.page.published_at ?? new Date().toISOString(),
      });
      await refresh();
      setUsername(normalized);
      toast.success("Endereço atualizado.");
    } catch {
      toast.error("Não foi possível salvar agora.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-rise">
      <header>
        <p className="text-sm font-medium text-primary">Conta</p>
        <h1 className="mt-1 text-3xl font-bold">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">Endereço público e acesso à conta.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Endereço da Bio</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ao trocar o username, o endereço anterior deixa de funcionar.
          </p>

          <div className="mt-5 space-y-2">
            <Label htmlFor="settings-username">Username</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-input bg-background px-3 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/25">
                <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                  {getPublicBioDisplay()}
                </span>
                <Input
                  id="settings-username"
                  value={username}
                  onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                  className="min-w-24 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                  maxLength={30}
                  autoComplete="off"
                />
              </div>
              <Button onClick={saveUsername} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold">Sua conta</h2>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={email} readOnly className="text-muted-foreground" />
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
