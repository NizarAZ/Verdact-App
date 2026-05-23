import { NextResponse } from "next/server";
import { amountToMicroUnits, verifyShelbyUsdTransfer } from "@/lib/onchain";
import { getActiveSubscription, getSupabaseAdmin, getVaultByWallet } from "@/lib/supabase-server";
import { getWalletAddress, normalizeWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const subscriberWallet = getWalletAddress(request);
    const { searchParams } = new URL(request.url);
    const creatorWallet = normalizeWalletAddress(searchParams.get("creator_wallet"));
    if (!creatorWallet) {
      return NextResponse.json({ error: "Missing creator wallet." }, { status: 400 });
    }

    const subscription = await getActiveSubscription(subscriberWallet, creatorWallet);
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load subscription." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const subscriberWallet = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const creatorWallet = normalizeWalletAddress(body.creator_wallet);
    const txHash = typeof body.tx_hash === "string" ? body.tx_hash.trim() : "";
    if (!creatorWallet || !txHash) {
      return NextResponse.json({ error: "Missing subscription transaction details." }, { status: 400 });
    }

    const vault = await getVaultByWallet(creatorWallet);
    if (!vault || !vault.is_paid || Number(vault.price_monthly) <= 0) {
      return NextResponse.json({ error: "Creator does not offer a paid subscription." }, { status: 400 });
    }

    const activeSubscription = await getActiveSubscription(subscriberWallet, creatorWallet);
    if (activeSubscription) {
      return NextResponse.json(
        {
          error: "Subscription is already active.",
          subscription: activeSubscription
        },
        { status: 409 }
      );
    }

    const amountMicroUnits = amountToMicroUnits(vault.price_monthly);
    await verifyShelbyUsdTransfer({
      txHash,
      senderWallet: subscriberWallet,
      recipientWallet: creatorWallet,
      expectedAmountMicroUnits: amountMicroUnits
    });

    const supabase = getSupabaseAdmin();
    const existing = await supabase.from("subscriptions").select("id").eq("tx_hash", txHash).maybeSingle();
    if (existing.data) return NextResponse.json({ error: "Subscription transaction already recorded." }, { status: 400 });
    if (existing.error) throw existing.error;

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 30 * 86_400_000);
    const amount = Number(vault.price_monthly);
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        subscriber_wallet: subscriberWallet,
        creator_wallet: creatorWallet,
        tx_hash: txHash,
        amount_paid: amount,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;

    const activeCount = await supabase
      .from("subscriptions")
      .select("subscriber_wallet", { count: "exact", head: true })
      .eq("creator_wallet", creatorWallet)
      .gt("expires_at", new Date().toISOString());

    await supabase
      .from("vaults")
      .update({
        total_earnings: Number(vault.total_earnings ?? 0) + amount,
        subscriber_count: activeCount.count ?? vault.subscriber_count ?? 0
      })
      .eq("wallet_address", creatorWallet);

    return NextResponse.json({ subscription: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save subscription." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 400 }
    );
  }
}
