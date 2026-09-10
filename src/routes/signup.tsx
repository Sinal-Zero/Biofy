import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta grátis no Biofy" },
      {
        name: "description",
        content: "Crie sua conta Biofy em segundos e monte sua página de bio personalizada.",
      },
      { property: "og:title", content: "Criar conta grátis no Biofy" },
      {
        property: "og:description",
        content: "Crie sua conta Biofy em segundos e monte sua página de bio personalizada.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { display_name: name.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "Este e-mail já tem uma conta. Tente entrar."
          : error.message.toLowerCase().includes("weak") ||
              error.message.toLowerCase().includes("pwned")
            ? "Essa senha é muito comum. Escolha outra."
            : "Não foi possível criar a conta agora.",
      );
      return;
    }
    if (!data.session) {
      toast.success("Confirme seu e-mail para continuar.");
      return;
    }
    toast.success("Conta criada! Vamos montar sua Bio.");
    navigate({ to: "/onboarding" });
  }

  return (
    <AuthShell
      title="Criar sua conta"
      subtitle="Sua bio. Do seu jeito. Comece grátis em menos de um minuto."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton label="Criar conta com Google" redirectPath="/onboarding" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Henrique Silva"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className="h-11"
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Começar grátis"}
          </Button>
        </form>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">
          Ao criar uma conta ou continuar com o Google, você declara que leu e concorda com os{" "}
          <Link to="/terms" className="font-medium text-foreground hover:underline">
            Termos de Uso
          </Link>{" "}
          e com a{" "}
          <Link to="/privacy" className="font-medium text-foreground hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
