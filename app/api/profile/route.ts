import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const [subscriptions, favourites, donations, vault] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("subscriber_wallet", walletAddress)
        .order("expires_at", { ascending: true }),
      supabase
        .from("favourites")
        .select("*")
        .eq("subscriber_wallet", walletAddress)
        .order("created_at", { ascending: false }),
      supabase
        .from("donations")
        .select("*")
        .eq("donor_wallet", walletAddress)
        .order("created_at", { ascending: false }),
      supabase.from("vaults").select("*").eq("wallet_address", walletAddress).maybeSingle()
    ]);

    if (subscriptions.error) throw subscriptions.error;
    if (favourites.error) throw favourites.error;
    if (donations.error) throw donations.error;
    if (vault.error) throw vault.error;

    const creatorWallets = [
      ...new Set([
        ...(subscriptions.data ?? []).map((item) => item.creator_wallet),
        ...(favourites.data ?? []).map((item) => item.creator_wallet),
        ...(donations.data ?? []).map((item) => item.creator_wallet)
      ])
    ];
    const creatorMap = new Map<string, unknown>();

    if (creatorWallets.length > 0) {
      const creators = await supabase.from("vaults").select("*").in("wallet_address", creatorWallets);
      if (creators.error) throw creators.error;
      for (const creator of creators.data ?? []) creatorMap.set(creator.wallet_address, creator);
    }

    const earliest = [
      vault.data?.created_at,
      ...(subscriptions.data ?? []).map((item) => item.starts_at),
      ...(donations.data ?? []).map((item) => item.created_at)
    ]
      .filter(Boolean)
      .sort()[0] ?? null;

    return NextResponse.json({
      wallet: walletAddress,
      vault: vault.data ?? null,
      memberSince: earliest,
      activeSubscriptions: (subscriptions.data ?? []).filter((item) => item.expires_at > now).map((item) => ({
        ...item,
        creator: creatorMap.get(item.creator_wallet) ?? null
      })),
      expiredSubscriptions: (subscriptions.data ?? []).filter((item) => item.expires_at <= now).map((item) => ({
        ...item,
        creator: creatorMap.get(item.creator_wallet) ?? null
      })),
      favourites: (favourites.data ?? []).map((item) => ({
        ...item,
        creator: creatorMap.get(item.creator_wallet) ?? null
      })),
      donations: (donations.data ?? []).map((item) => ({
        ...item,
        creator: creatorMap.get(item.creator_wallet) ?? null
      })),
      totalDonated: (donations.data ?? []).reduce((total, item) => total + Number(item.amount ?? 0), 0)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load profile." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
