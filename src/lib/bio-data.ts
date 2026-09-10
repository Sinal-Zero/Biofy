import { publicSupabase, supabase } from "@/integrations/supabase/client";
import type { BioBlock, BioPage, BioProfile, BlockConfig, BioTheme } from "./bio-types";

export interface BioBundle {
  profile: BioProfile;
  page: BioPage;
  blocks: BioBlock[];
}

export interface PublicBioBundle {
  profile: Omit<BioProfile, "id">;
  page: Omit<BioPage, "user_id">;
  blocks: BioBlock[];
}

export interface AnalyticsSummary {
  views: number;
  clicks: number;
  ctr: number;
  topBlockId: string | null;
}

function asJson(value: unknown): never {
  return value as never;
}

function castBlocks(rows: unknown[]): BioBlock[] {
  return (rows as Array<Record<string, unknown>>).map((row) => ({
    id: row["id"] as string,
    page_id: row["page_id"] as string,
    type: row["type"] as string,
    title: (row["title"] as string | null) ?? null,
    url: (row["url"] as string | null) ?? null,
    config: (row["config"] as BlockConfig) ?? {},
    position: row["position"] as number,
    is_visible: row["is_visible"] as boolean,
  }));
}

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
    },
    page: {
      id: pageRow.id,
      user_id: pageRow.user_id,
      username: pageRow.username,
      template: pageRow.template,
      theme: (pageRow.theme ?? {}) as Partial<BioTheme>,
      is_published: pageRow.is_published,
      published_at: pageRow.published_at,
    },
    blocks: castBlocks(blocksRes.data ?? []),
  };
}

export async function fetchPublicBio(username: string): Promise<PublicBioBundle | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;

  const [profileRes, pageRes] = await Promise.all([
    publicSupabase
      .from("public_profiles")
      .select("username, display_name, avatar_url, bio")
      .eq("username", normalized)
      .maybeSingle(),
    publicSupabase
      .from("pages")
      .select("id, username, template, theme, is_published, published_at")
      .eq("username", normalized)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (pageRes.error) throw pageRes.error;
  if (!profileRes.data || !pageRes.data) return null;

  const blocksRes = await publicSupabase
    .from("page_blocks")
    .select("id, page_id, type, title, url, config, position, is_visible")
    .eq("page_id", pageRes.data.id)
    .eq("is_visible", true)
    .order("position", { ascending: true });
  if (blocksRes.error) throw blocksRes.error;

  return {
    profile: {
      username: profileRes.data.username,
      display_name: profileRes.data.display_name,
      avatar_url: profileRes.data.avatar_url,
      bio: profileRes.data.bio,
    },
    page: {
      id: pageRes.data.id,
      username: pageRes.data.username,
      template: pageRes.data.template,
      theme: (pageRes.data.theme ?? {}) as Partial<BioTheme>,
      is_published: pageRes.data.is_published,
      published_at: pageRes.data.published_at,
    },
    blocks: castBlocks(blocksRes.data ?? []),
  };
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<BioProfile, "username" | "display_name" | "avatar_url" | "bio">>,
) {
  const { error } = await supabase.from("profiles").update(asJson(patch)).eq("id", userId);
  if (error) throw error;
}

export async function updatePage(
  pageId: string,
  patch: {
    theme?: Partial<BioTheme>;
    template?: string;
    is_published?: boolean;
    published_at?: string | null;
  },
) {
  const { error } = await supabase.from("pages").update(asJson(patch)).eq("id", pageId);
  if (error) throw error;
}

export async function createBlock(input: {
  page_id: string;
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
  const results = await Promise.all(
    blocks.map((block, index) =>
      supabase.from("page_blocks").update({ position: index }).eq("id", block.id),
    ),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) throw failure.error;
}

export async function checkUsername(candidate: string): Promise<boolean> {
  const normalized = candidate.trim().toLowerCase();
  const { data, error } = await supabase.rpc("is_username_available", { candidate: normalized });
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

export async function recordAnalytics(
  pageId: string,
  kind: "view" | "click",
  blockId?: string | null,
) {
  const { error } = await publicSupabase.from("analytics_events").insert({
    page_id: pageId,
    block_id: blockId ?? null,
    kind,
    referrer: typeof document !== "undefined" ? document.referrer.slice(0, 1000) || null : null,
  });
  if (error) throw error;
}

export async function fetchAnalytics(pageId: string, days = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("kind, block_id")
    .eq("page_id", pageId)
    .gte("created_at", since);
  if (error) throw error;

  let views = 0;
  let clicks = 0;
  const clickCounts = new Map<string, number>();
  for (const event of data ?? []) {
    if (event.kind === "view") views += 1;
    if (event.kind === "click") {
      clicks += 1;
      if (event.block_id)
        clickCounts.set(event.block_id, (clickCounts.get(event.block_id) ?? 0) + 1);
    }
  }

  let topBlockId: string | null = null;
  let topCount = 0;
  for (const [blockId, count] of clickCounts) {
    if (count > topCount) {
      topBlockId = blockId;
      topCount = count;
    }
  }

  return {
    views,
    clicks,
    ctr: views > 0 ? (clicks / views) * 100 : 0,
    topBlockId,
  };
}
