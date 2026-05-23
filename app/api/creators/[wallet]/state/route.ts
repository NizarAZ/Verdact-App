import { NextResponse } from "next/server";
import { getActiveSubscription, getContentForVault, getSupporterCount, getVaultByWallet, hasFavourite } from "@/lib/supabase-server";
import { normalizeWalletAddress, sameWallet } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { wallet: string } }) {
  try {
    const creatorWallet = normalizeWalletAddress(params.wallet);
    if (!creatorWallet) return NextResponse.json({ error: "Invalid creator wallet." }, { status: 400 });

    const viewerWallet = normalizeWalletAddress(request.headers.get("x-wallet-address"));
    const vault = await getVaultByWallet(creatorWallet);
    if (!vault) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

    const [content, subscription, favourite, supporterCount] = await Promise.all([
      getContentForVault(vault.id),
      viewerWallet ? getActiveSubscription(viewerWallet, creatorWallet) : Promise.resolve(null),
      viewerWallet ? hasFavourite(viewerWallet, creatorWallet) : Promise.resolve(false),
      vault.show_donation_total ? getSupporterCount(creatorWallet) : Promise.resolve(0)
    ]);

    const owner = sameWallet(viewerWallet, creatorWallet);
    const hasAccess = !vault.is_paid || owner || Boolean(subscription);

    return NextResponse.json({
      vault,
      content,
      hasAccess,
      isOwner: owner,
      isFavourite: favourite,
      supporterCount,
      subscription
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load creator." }, { status: 500 });
  }
}
