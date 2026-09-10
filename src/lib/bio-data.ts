import { supabase } from "@/integrations/supabase/client";
import type { BioBlock, BioPage, BioProfile, BlockConfig, BioTheme } from "./bio-types";

export interface BioBundle {
  profile: BioProfile;
  page: BioPage;
  blocks: BioBlock[];
}

function castBlocks(rows: unknown[]): BioBlock[] {
  return (rows as Array<Record<string, unknown>>).map((row) => ({
    id: row["id"] as string,
    page_id: row["page_id"] as string,
    user_id: row["user_id"] as string,
    type: row["type"] as string,
    title: (row["title"] as string | null) ?? null,
    url: (row["url"] as string | null) ?? null,
    config: (row["config"] as BlockConfig) ?? {},
    position: row["position"] as number,
    is_visible: row["is_visible"] as boolean,
  }));
}

/** Loads (and lazily bootstraps) the signed-in user's profile, page and blocks. */
export async function fetchMyBio(userId: string): Promise<BioBundle> {
  const [profileRes, pageRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("pages").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (pageRes.error) throw pageRes.error;

  let profileRow = profileRes.data;
  if (!profileRow) {
    const created = await supabase.from("profiles").insert({ id: userId }).select("*").single();
    if (created.error) throw created.error;
    profileRow = created.data;
  }

  let pageRow = pageRes.data;
  if (!pageRow) {
    const created = await supabase.from("pages").insert({ user_id: userId }).select("*").single();
    if (created.error) throw created.error;
    pageRow = created.data;
  }

  const blocksRes = await supabase
    .from("page_blocks")
    .select("*")
    .eq("page_id", pageRow.id)
    .order("position", { ascending: true });
  if (blocksRes.error) throw blocksRes.error;

  return {
    profile: {
      id: profileRow.id,
      username: profileRow.username,
      display_name: profileRow.display_name,
      avatar_url: profileRow.avatar_url,
      bio: profileRow.bio,
      plan: profileRow.plan,
      onboarded: profileRow.onboarded,
    },
    page: {
      id: pageRow.id,
      user_id: pageRow.user_id,
      template: pageRow.template,
      theme: (pageRow.theme ?? {}) as Partial<BioTheme>,
      is_published: pageRow.is_published,
      published_at: pageRow.published_at,
    },
    blocks: castBlocks(blocksRes.data ?? []),
  };
}

/** Supabase's generated Json type is structural; our typed shapes need a cast. */
function asJson(value: unknown): never {
  return value as never;
}

export async function updateProfile(userId: string, patch: Partial<BioProfile>) {
  const { error } = await supabase.from("profiles").update(asJson(patch)).eq("id", userId);
  if (error) throw error;
}

export async function updatePage(
  pageId: string,
  patch: {
    theme?: Partial<BioTheme>;
    template?: string;
    is_published?: boolean;
    published_at?: string;
  },
) {
  const { error } = await supabase.from("pages").update(asJson(patch)).eq("id", pageId);
  if (error) throw error;
}

export async function createBlock(input: {
  page_id: string;
  user_id: string;
  type: string;
  title?: string | null;
  url?: string | null;
  config?: BlockConfig;
  position: number;
}) {
  const { data, error } = await supabase
    .from("page_blocks")
    .insert(
      asJson({
        page_id: input.page_id,
        user_id: input.user_id,
        type: input.type,
        title: input.title ?? null,
        url: input.url ?? null,
        config: input.config ?? {},
        position: input.position,
      }),
    )
    .select("*")
    .single();
  if (error) throw error;
  return castBlocks([data])[0]!;
}

export async function updateBlock(
  id: string,
  patch: {
    title?: string | null;
    url?: string | null;
    config?: BlockConfig;
    is_visible?: boolean;
    position?: number;
  },
) {
  const { error } = await supabase.from("page_blocks").update(asJson(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteBlock(id: string) {
  const { error } = await supabase.from("page_blocks").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderBlocks(blocks: BioBlock[]) {
  await Promise.all(
    blocks.map((block, index) =>
      supabase.from("page_blocks").update({ position: index }).eq("id", block.id),
    ),
  );
}

export async function checkUsername(candidate: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_username_available", { candidate });
  if (error) throw error;
  return Boolean(data);
}

export async function fetchSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
