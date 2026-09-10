import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { BioProvider } from "@/components/dashboard/BioContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyBio } from "@/lib/bio-data";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  loader: async ({ context }) => {
    const bundle = await fetchMyBio(context.user.id);
    if (!bundle.profile.username) throw redirect({ to: "/onboarding" });
    return bundle;
  },
  component: DashboardRoute,
});

function DashboardRoute() {
  const initial = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  return (
    <BioProvider initial={initial} userId={user.id}>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </BioProvider>
  );
}
