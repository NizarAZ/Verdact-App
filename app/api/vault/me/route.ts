import { NextResponse } from "next/server";
import { categories, getContentForVault, getSupabaseAdmin, getVaultByWallet } from "@/lib/supabase-server";
import { getWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanCategory(value: unknown) {
  const category = cleanString(value, 40);
  return categories.includes(category as (typeof categories)[number]) ? category : "Other";
}

function cleanPrice(value: unknown) {
  const price = Number(value ?? 0);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

export async function GET(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const supabase = getSupabaseAdmin();
    const vault = await getVaultByWallet(walletAddress);

    if (!vault) return NextResponse.json({ vault: null });

    const [content, donations] = await Promise.all([
      getContentForVault(vault.id),
      supabase
        .from("donations")
        .select("*")
        .eq("creator_wallet", walletAddress)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const contentIds = content.map((item) => item.id);
    const viewsByContent = new Map<string, number>();
    if (contentIds.length > 0) {
      const { data: views, error } = await supabase.from("content_views").select("content_id").in("content_id", contentIds);
      if (error) throw error;
      for (const view of views ?? []) {
        viewsByContent.set(view.content_id, (viewsByContent.get(view.content_id) ?? 0) + 1);
      }
    }

    return NextResponse.json({
      vault,
      content: content.map((item) => ({ ...item, view_count: viewsByContent.get(item.id) ?? 0 })),
      donations: donations.data ?? [],
      stats: {
        subscribers: vault.subscriber_count ?? 0,
        earnings: Number(vault.total_earnings ?? 0),
        contentItems: content.length,
        views: [...viewsByContent.values()].reduce((total, count) => total + count, 0)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load vault." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const isPaid = Boolean(body.is_paid);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("vaults")
      .insert({
        wallet_address: walletAddress,
        display_name: cleanString(body.display_name, 80) || "Untitled creator",
        bio: cleanString(body.bio, 600),
        category: cleanCategory(body.category),
        is_paid: isPaid,
        price_monthly: isPaid ? cleanPrice(body.price_monthly) : 0,
        show_donation_total: body.show_donation_total !== false
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ vault: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create vault." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const isPaid = Boolean(body.is_paid);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("vaults")
      .update({
        display_name: cleanString(body.display_name, 80) || "Untitled creator",
        bio: cleanString(body.bio, 600),
        category: cleanCategory(body.category),
        avatar_blob_id: cleanString(body.avatar_blob_id, 300) || null,
        cover_blob_id: cleanString(body.cover_blob_id, 300) || null,
        is_paid: isPaid,
        price_monthly: isPaid ? cleanPrice(body.price_monthly) : 0,
        show_donation_total: body.show_donation_total !== false
      })
      .eq("wallet_address", walletAddress)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ vault: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update vault." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
