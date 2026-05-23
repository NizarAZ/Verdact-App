import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getWalletAddress, normalizeWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const subscriberWallet = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const creatorWallet = normalizeWalletAddress(body.creator_wallet);
    if (!creatorWallet) return NextResponse.json({ error: "Invalid creator wallet." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("favourites").upsert(
      {
        subscriber_wallet: subscriberWallet,
        creator_wallet: creatorWallet
      },
      { onConflict: "subscriber_wallet,creator_wallet" }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save favourite." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const subscriberWallet = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const creatorWallet = normalizeWalletAddress(body.creator_wallet);
    if (!creatorWallet) return NextResponse.json({ error: "Invalid creator wallet." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("subscriber_wallet", subscriberWallet)
      .eq("creator_wallet", creatorWallet);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove favourite." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
