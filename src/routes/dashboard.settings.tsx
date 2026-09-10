import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useBio } from "@/components/dashboard/BioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { checkUsername, updateProfile } from "@/lib/bio-data";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30);
}

function SettingsPage() {
  const navigate = useNavigate();
  const { bundle, refresh } = useBio();
  const [username, setUsername] = useState(bundle.profile.username ?? "");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function saveUsername() {
    const normalized = normalizeUsername(username);
    if (normalized.length < 3) {
      toast.error("Use pelo menos 3 caracteres.");
      return;
    }
    if (normalized === bundle.profile.username) {
      toast.message("Nenhuma alteração para salvar.");
      return;
    }

    setSaving(true);
    try {
      if (!(await checkUsername(normalized))) {
        toast.error("Esse username não está disponível.");
        return;
      }
      await updateProfile(bundle.profile.id, { username: normalized });
      await refresh();
      setUsername(normalized);
      toast.success("Username atualizado.");
    } catch {
      toast.error("Não foi possível alterar o username.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Conta</p>
        <h1 className="mt-1 text-3xl font-bold">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie seu endereço público e sua sessão.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Endereço da Bio</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ao mudar o username, o endereço público anterior deixa de apontar para sua página.
        </p>
        <div className="mt-5 space-y-2">
          <Label htmlFor="settings-username">Username</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-input bg-background px-3">
              <span className="text-sm text-muted-foreground">biofy.com/</span>
              <Input
                id="settings-username"
                value={username}
                onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button onClick={saveUsername} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Conta</h2>
        <div className="mt-5 space-y-2">
          <Label>E-mail</Label>
          <Input value={email} readOnly className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            O e-mail é gerenciado pelo sistema de autenticação.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Sessão</h2>
        <p className="mt-1 text-sm text-muted-foreground">Encerre sua sessão neste dispositivo.</p>
        <Button variant="outline" className="mt-4" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      </section>
    </div>
  );
}
