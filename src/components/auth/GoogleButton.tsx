import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function GoogleButton({
  label = "Continuar com Google",
  redirectPath = "/dashboard",
}: {
  label?: string;
  redirectPath?: "/dashboard" | "/onboarding";
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });

      if (error) {
        toast.error("Não foi possível entrar com o Google.");
        setLoading(false);
      }
    } catch {
      toast.error("Não foi possível entrar com o Google.");
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full gap-2.5 border-border bg-surface-2/60 hover:bg-surface-2"
      onClick={handleClick}
      disabled={loading}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5A9.6 9.6 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-2H12Z"
        />
      </svg>
      {loading ? "Conectando..." : label}
    </Button>
  );
}
