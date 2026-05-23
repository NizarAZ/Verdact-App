import { NextResponse } from "next/server";
import { amountToMicroUnits, microUnitsToAmount, verifyShelbyUsdTransfer } from "@/lib/onchain";
import { getSupabaseAdmin, getVaultByWallet } from "@/lib/supabase-server";
import { getWalletAddress, normalizeWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function message(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 140) : "";
}

export async function POST(request: Request) {
  try {
    const donorWallet = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const creatorWallet = normalizeWalletAddress(body.creator_wallet);
    const txHash = typeof body.tx_hash === "string" ? body.tx_hash.trim() : "";
    const amountMicroUnits = amountToMicroUnits(body.amount);

    if (!creatorWallet || !txHash || amountMicroUnits <= BigInt(0)) {
      return NextResponse.json({ error: "Missing donation transaction details." }, { status: 400 });
    }

    const vault = await getVaultByWallet(creatorWallet);
    if (!vault || vault.is_paid) {
      return NextResponse.json({ error: "Donations are only available for free creators." }, { status: 400 });
    }

    await verifyShelbyUsdTransfer({
      txHash,
      senderWallet: donorWallet,
      recipientWallet: creatorWallet,
      expectedAmountMicroUnits: amountMicroUnits
    });

    const supabase = getSupabaseAdmin();
    const existing = await supabase.from("donations").select("id").eq("tx_hash", txHash).maybeSingle();
    if (existing.data) return NextResponse.json({ error: "Donation transaction already recorded." }, { status: 400 });
    if (existing.error) throw existing.error;

    const amount = microUnitsToAmount(amountMicroUnits);
    const { data, error } = await supabase
      .from("donations")
      .insert({
        donor_wallet: donorWallet,
        creator_wallet: creatorWallet,
        amount,
        message: message(body.message) || null,
        tx_hash: txHash
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabase
      .from("vaults")
      .update({ total_earnings: Number(vault.total_earnings ?? 0) + amount })
      .eq("wallet_address", creatorWallet);

    return NextResponse.json({ donation: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save donation." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 400 }
    );
  }
}
