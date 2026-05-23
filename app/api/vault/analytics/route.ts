import { NextResponse } from "next/server";
import { getContentForVault, getSupabaseAdmin, getVaultByWallet } from "@/lib/supabase-server";
import { getWalletAddress, shortenAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function day(value?: string | null) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function sumByDay<T>(items: T[], getDate: (item: T) => string | null | undefined, getValue: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = day(getDate(item));
    map.set(key, (map.get(key) ?? 0) + getValue(item));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

export async function GET(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const vault = await getVaultByWallet(walletAddress);
    if (!vault) return NextResponse.json({ error: "Vault not found." }, { status: 404 });

    const supabase = getSupabaseAdmin();
    const content = await getContentForVault(vault.id);
    const contentIds = content.map((item) => item.id);

    const [views, subscriptions, donations] = await Promise.all([
      contentIds.length > 0
        ? supabase.from("content_views").select("*").in("content_id", contentIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("creator_wallet", walletAddress)
        .order("starts_at", { ascending: false }),
      supabase
        .from("donations")
        .select("*")
        .eq("creator_wallet", walletAddress)
        .order("created_at", { ascending: false })
    ]);

    if (views.error) throw views.error;
    if (subscriptions.error) throw subscriptions.error;
    if (donations.error) throw donations.error;

    const viewsByContent = new Map<string, number>();
    for (const view of views.data ?? []) viewsByContent.set(view.content_id, (viewsByContent.get(view.content_id) ?? 0) + 1);

    return NextResponse.json({
      viewsPerContent: content.map((item) => ({ name: item.title, views: viewsByContent.get(item.id) ?? 0 })),
      viewsOverTime: sumByDay(views.data ?? [], (item) => item.viewed_at, () => 1),
      subscribersOverTime: sumByDay(subscriptions.data ?? [], (item) => item.starts_at, () => 1),
      earningsOverTime: sumByDay(
        [...(subscriptions.data ?? []), ...(donations.data ?? [])],
        (item) => ("starts_at" in item ? item.starts_at : item.created_at),
        (item) => Number("amount_paid" in item ? item.amount_paid : item.amount)
      ),
      topContent: content
        .map((item) => ({ ...item, view_count: viewsByContent.get(item.id) ?? 0 }))
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 8),
      recentSubscribers: (subscriptions.data ?? []).slice(0, 8).map((item) => ({
        wallet: item.subscriber_wallet,
        label: shortenAddress(item.subscriber_wallet),
        amount: item.amount_paid,
        expires_at: item.expires_at
      })),
      recentDonations: donations.data ?? []
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
