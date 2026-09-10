import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BioPreview } from "@/components/bio/BioPreview";
import { publicSupabase } from "@/integrations/supabase/client";
import { fetchPublicBio, recordAnalytics } from "@/lib/bio-data";

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    const bundle = await fetchPublicBio(params.username);
    if (!bundle) throw notFound();

    const { data: plan } = await publicSupabase.rpc(
      "get_public_plan" as never,
      { target_page_id: bundle.page.id } as never,
    );

    return {
      ...bundle,
      plan: typeof plan === "string" ? plan : "free",
    };
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.profile.display_name || `@${params.username}`;
    const description = loaderData?.profile.bio || `Veja os links de ${name} no Biofy.`;
    return {
      meta: [
        { title: `${name} | Biofy` },
        { name: "description", content: description.slice(0, 160) },
        { property: "og:title", content: `${name} | Biofy` },
        { property: "og:description", content: description.slice(0, 160) },
        { property: "og:type", content: "profile" },
        ...(loaderData?.profile.avatar_url
          ? [{ property: "og:image", content: loaderData.profile.avatar_url }]
          : []),
      ],
    };
  },
  component: PublicBioPage,
});

function PublicBioPage() {
  const bundle = Route.useLoaderData();
  const tracked = useRef(false);
  const showBranding = bundle.plan !== "pro" && bundle.plan !== "business";

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    recordAnalytics(bundle.page.id, "view").catch(() => undefined);
  }, [bundle.page.id]);

  return (
    <main className="min-h-dvh sm:flex sm:items-center sm:justify-center sm:bg-background sm:p-6">
      <div className="min-h-dvh w-full sm:min-h-0 sm:h-[min(860px,calc(100dvh-48px))] sm:max-w-[560px] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl">
        <BioPreview
          displayName={bundle.profile.display_name}
          username={bundle.profile.username}
          bio={bundle.profile.bio}
          avatarUrl={bundle.profile.avatar_url}
          theme={bundle.page.theme}
          blocks={bundle.blocks}
          interactive
          showBranding={showBranding}
          onBlockClick={(block) => {
            recordAnalytics(bundle.page.id, "click", block.id).catch(() => undefined);
          }}
          className="min-h-full"
        />
      </div>
    </main>
  );
}
