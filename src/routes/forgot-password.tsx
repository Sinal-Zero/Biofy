import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Biofy" },
      {
        name: "description",
        content: "Receba um link por e-mail para criar uma nova senha no Biofy.",
      },
      { property: "og:title", content: "Recuperar senha — Biofy" },
      {
        property: "og:description",
        content: "Receba um link por e-mail para criar uma nova senha.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail agora.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title="Recuperar acesso"
      subtitle="Enviamos um link para você criar uma nova senha."
      footer={
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Voltar para entrar
        </Link>
      }
    >
      {sent ? (
        <div className="animate-pop rounded-2xl border border-border bg-surface-2/50 p-6 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-success" />
          <p className="mt-3 font-semibold">Link enviado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifique a caixa de entrada de {email}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail da conta</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="h-11"
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
