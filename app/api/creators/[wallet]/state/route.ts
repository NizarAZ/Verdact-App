import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { creatorHasVerifiedPayments, getActiveSubscription, getContentForVault, getLatestSubscription, getSupporterCount, getVaultByWallet, hasFavourite, redactLockedContent } from "@/lib/supabase-server";
import { normalizeWalletAddress, sameWallet } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request, { params }: { params: { wallet: string } }) {
  try {
    noStore();

    const creatorWallet = normalizeWalletAddress(params.wallet);
    if (!creatorWallet) return NextResponse.json({ error: "Invalid creator wallet." }, { status: 400 });

    const viewerWallet = normalizeWalletAddress(request.headers.get("x-wallet-address"));
    const vault = await getVaultByWallet(creatorWallet);
    if (!vault) return NextResponse.json({ error: "Creator not found." }, { status: 404 });

    const [content, subscription, latestSubscription, favourite, supporterCount, paymentsVerified] = await Promise.all([
      getContentForVault(vault.id),
      viewerWallet ? getActiveSubscription(viewerWallet, creatorWallet) : Promise.resolve(null),
      viewerWallet ? getLatestSubscription(viewerWallet, creatorWallet) : Promise.resolve(null),
      viewerWallet ? hasFavourite(viewerWallet, creatorWallet) : Promise.resolve(false),
      vault.show_donation_total ? getSupporterCount(creatorWallet) : Promise.resolve(0),
      creatorHasVerifiedPayments(creatorWallet)
    ]);

    const owner = sameWallet(viewerWallet, creatorWallet);
    const hasAccess = !vault.is_paid || owner || Boolean(subscription);
    const expiredSubscription = latestSubscription && !subscription && latestSubscription.expires_at <= new Date().toISOString() ? latestSubscription : null;

    return NextResponse.json({
      vault,
      content: redactLockedContent(content, hasAccess),
      hasAccess,
      isOwner: owner,
      isFavourite: favourite,
      supporterCount,
      subscription,
      expiredSubscription,
      paymentsVerified
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load creator." }, { status: 500 });
  }
}
