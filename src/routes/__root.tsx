import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import polishCss from "../polish.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[min(620px,92vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-[130px]" />
      <div className="biofy-card relative w-full max-w-md p-7 text-center sm:p-9">
        <h1 className="gradient-text text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Este endereço não existe ou a Bio ainda não foi publicada.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-[transform,filter] duration-200 hover:brightness-105 active:scale-[0.985]"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" />
      <div className="biofy-card relative w-full max-w-md p-7 text-center sm:p-9">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Algo deu errado do nosso lado. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-[transform,filter] duration-200 hover:brightness-105 active:scale-[0.985]"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background/60 px-4 text-sm font-semibold text-foreground transition-[background-color,border-color,transform] duration-200 hover:border-primary/25 hover:bg-accent/70 active:scale-[0.985]"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Biofy — Sua bio. Do seu jeito." },
      {
        name: "description",
        content:
          "Crie uma página única para reunir todos os seus links, mostrar quem você é e transformar sua bio em algo realmente seu.",
      },
      { name: "author", content: "Biofy" },
      { property: "og:title", content: "Biofy — Sua bio. Do seu jeito." },
      {
        property: "og:description",
        content: "Reúna seus links em uma página personalizada e compartilhe um único endereço.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: polishCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Bebas+Neue&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
