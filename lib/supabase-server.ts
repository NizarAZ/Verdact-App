import { createClient } from "@supabase/supabase-js";
import { categories } from "@/lib/constants";
import { readServerEnv } from "@/lib/server-env";
import { normalizeWalletAddress } from "@/lib/wallet";

export type VaultRecord = {
  id: string;
  wallet_address: string;
  display_name: string | null;
  bio: string | null;
  category: string | null;
  avatar_blob_id: string | null;
  cover_blob_id: string | null;
  is_paid: boolean;
  price_monthly: number;
  subscriber_count: number;
  total_earnings: number;
  show_donation_total: boolean;
  created_at: string | null;
};

export type ContentRecord = {
  id: string;
  vault_id: string;
  wallet_address: string;
  title: string;
  description: string | null;
  file_type: string | null;
  file_name: string | null;
  blob_id: string | null;
  onchain_tx_hash: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  thumbnail_blob_id: string | null;
  allow_download: boolean;
  is_preview: boolean;
  is_locked: boolean;
  tags: string[] | null;
  created_at: string | null;
};

export type DonationRecord = {
  id: string;
  donor_wallet: string;
  creator_wallet: string;
  amount: number;
  message: string | null;
  tx_hash: string;
  block_height: string | null;
  created_at: string | null;
};

export type SubscriptionRecord = {
  id: string;
  subscriber_wallet: string;
  creator_wallet: string;
  tx_hash: string;
  block_height: string | null;
  amount_paid: number;
  starts_at: string | null;
  expires_at: string;
};

export type CreatorCard = VaultRecord & {
  content_count: number;
  preview_count: number;
  latest_preview_content: Pick<ContentRecord, "id" | "wallet_address" | "title" | "description" | "file_type" | "thumbnail_blob_id" | "is_preview" | "created_at">[];
};

export type CategoryStat = {
  category: string;
  creators: number;
  files: number;
};

export { categories };

export function getSupabaseAdmin() {
  const url = readServerEnv("SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function listCreators(params: {
  access?: "all" | "free" | "paid";
  category?: string;
  sort?: "newest" | "subscribers" | "content" | "price_low" | "price_high";
  q?: string;
} = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("vaults").select("*");

  if (params.access === "free") query = query.eq("is_paid", false);
  if (params.access === "paid") query = query.eq("is_paid", true);
  if (params.category) query = query.eq("category", params.category);

  if (params.sort === "subscribers") {
    query = query.order("subscriber_count", { ascending: false });
  } else if (params.sort === "price_low") {
    query = query.order("price_monthly", { ascending: true });
  } else if (params.sort === "price_high") {
    query = query.order("price_monthly", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(100);
  if (error) {
    if (error.code === "PGRST205" || error.message.includes("vaults")) return [];
    throw error;
  }

  let vaults = (data ?? []) as VaultRecord[];
  const search = params.q?.trim().toLowerCase();
  if (search) {
    vaults = vaults.filter((vault) =>
      [vault.display_name, vault.bio, vault.category, vault.wallet_address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }

  const ids = vaults.map((vault) => vault.id);
  const counts = new Map<string, number>();
  const previewCounts = new Map<string, number>();
  const latestPreview = new Map<string, CreatorCard["latest_preview_content"]>();

  if (ids.length > 0) {
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id,vault_id,wallet_address,title,description,file_type,thumbnail_blob_id,is_preview,created_at")
      .in("vault_id", ids)
      .order("created_at", { ascending: false });
    if (contentError) throw contentError;
    for (const item of content ?? []) {
      counts.set(item.vault_id, (counts.get(item.vault_id) ?? 0) + 1);
      if (item.is_preview) {
        previewCounts.set(item.vault_id, (previewCounts.get(item.vault_id) ?? 0) + 1);
        const previews = latestPreview.get(item.vault_id) ?? [];
        if (previews.length < 3) {
          previews.push({
            id: item.id,
            wallet_address: item.wallet_address,
            title: item.title,
            description: item.description,
            file_type: item.file_type,
            thumbnail_blob_id: item.thumbnail_blob_id,
            is_preview: item.is_preview,
            created_at: item.created_at
          });
          latestPreview.set(item.vault_id, previews);
        }
      }
    }
  }

  const creators = vaults.map((vault) => ({
    ...vault,
    content_count: counts.get(vault.id) ?? 0,
    preview_count: previewCounts.get(vault.id) ?? 0,
    latest_preview_content: latestPreview.get(vault.id) ?? []
  }));

  if (params.sort === "content") {
    creators.sort((a, b) => b.content_count - a.content_count);
  }

  return creators satisfies CreatorCard[];
}

export async function getCategoryStats() {
  const supabase = getSupabaseAdmin();
  const { data: vaults, error } = await supabase.from("vaults").select("id,category");
  if (error) throw error;

  const ids = (vaults ?? []).map((vault) => vault.id);
  const filesByVault = new Map<string, number>();
  if (ids.length > 0) {
    const { data: content, error: contentError } = await supabase.from("content").select("vault_id").in("vault_id", ids);
    if (contentError) throw contentError;
    for (const item of content ?? []) filesByVault.set(item.vault_id, (filesByVault.get(item.vault_id) ?? 0) + 1);
  }

  const stats = new Map<string, CategoryStat>();
  for (const vault of vaults ?? []) {
    const category = vault.category || "Other";
    const current = stats.get(category) ?? { category, creators: 0, files: 0 };
    current.creators += 1;
    current.files += filesByVault.get(vault.id) ?? 0;
    stats.set(category, current);
  }

  return [...stats.values()];
}

export async function getVaultByWallet(walletAddress: string) {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vaults")
    .select("*")
    .eq("wallet_address", normalized)
    .maybeSingle();

  if (error) throw error;
  return data as VaultRecord | null;
}

export async function getContentForVault(vaultId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("vault_id", vaultId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContentRecord[];
}

export function redactLockedContent(content: ContentRecord[], canAccessLocked: boolean) {
  return content.map((item) => {
    if (canAccessLocked || item.is_preview || !item.is_locked) return item;
    return {
      ...item,
      blob_id: null,
      onchain_tx_hash: null,
      thumbnail_blob_id: null
    };
  });
}

export async function getActiveSubscription(subscriberWallet: string, creatorWallet: string) {
  const subscriber = normalizeWalletAddress(subscriberWallet);
  const creator = normalizeWalletAddress(creatorWallet);
  if (!subscriber || !creator) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("subscriber_wallet", subscriber)
    .eq("creator_wallet", creator)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as SubscriptionRecord | null;
}

export async function getLatestSubscription(subscriberWallet: string, creatorWallet: string) {
  const subscriber = normalizeWalletAddress(subscriberWallet);
  const creator = normalizeWalletAddress(creatorWallet);
  if (!subscriber || !creator) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("subscriber_wallet", subscriber)
    .eq("creator_wallet", creator)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as SubscriptionRecord | null;
}

export async function creatorHasVerifiedPayments(creatorWallet: string) {
  const creator = normalizeWalletAddress(creatorWallet);
  if (!creator) return false;

  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("creator_wallet", creator);

  if (error) throw error;
  return Boolean(count && count > 0);
}

export async function hasFavourite(subscriberWallet: string, creatorWallet: string) {
  const subscriber = normalizeWalletAddress(subscriberWallet);
  const creator = normalizeWalletAddress(creatorWallet);
  if (!subscriber || !creator) return false;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("favourites")
    .select("id")
    .eq("subscriber_wallet", subscriber)
    .eq("creator_wallet", creator)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getSupporterCount(creatorWallet: string) {
  const creator = normalizeWalletAddress(creatorWallet);
  if (!creator) return 0;

  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("donations")
    .select("donor_wallet", { count: "exact", head: true })
    .eq("creator_wallet", creator);

  if (error) throw error;
  return count ?? 0;
}
