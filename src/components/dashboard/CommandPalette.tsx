import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Copy,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Paintbrush,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getPublicBioUrl } from "@/lib/public-url";
import { useBio } from "./BioContext";

export function CommandPalette({ showAi }: { showAi: boolean }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { bundle } = useBio();
  const username = bundle.profile.username;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function go(to: string) {
    setOpen(false);
    void navigate({ to });
  }

  async function copyLink() {
    setOpen(false);
    if (!username) return;
    await navigator.clipboard.writeText(getPublicBioUrl(username));
    toast.success("Link copiado!");
  }

  function openPublic() {
    setOpen(false);
    if (!username) return;
    window.open(getPublicBioUrl(username), "_blank", "noopener,noreferrer");
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar uma ação..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Navegar">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard />
            Visão geral
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/editor")}>
            <Sparkles />
            Abrir Editor
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/appearance")}>
            <Paintbrush />
            Abrir Aparência
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/analytics")}>
            <BarChart3 />
            Abrir Analytics
          </CommandItem>
          {showAi ? (
            <CommandItem onSelect={() => go("/dashboard/ai")}>
              <Sparkles />
              Abrir Biofy AI
            </CommandItem>
          ) : null}
          <CommandItem onSelect={() => go("/dashboard/subscription")}>
            <CreditCard />
            Abrir Assinatura
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/settings")}>
            <Settings />
            Abrir Configurações
          </CommandItem>
        </CommandGroup>
        {username ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bio pública">
              <CommandItem onSelect={copyLink}>
                <Copy />
                Copiar link da Bio
              </CommandItem>
              <CommandItem onSelect={openPublic}>
                <ExternalLink />
                Abrir página publicada
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
