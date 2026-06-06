import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { CreatorProfileClient } from "@/components/creator/CreatorProfileClient";
import { creatorHasVerifiedPayments, getContentForVault, getSupporterCount, getVaultByWallet, redactLockedContent } from "@/lib/supabase-server";
import { normalizeWalletAddress } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CreatorPage({ params }: { params: { wallet: string } }) {
  noStore();

  const wallet = normalizeWalletAddress(params.wallet);
  if (!wallet) notFound();

  const vault = await getVaultByWallet(wallet);
  if (!vault) notFound();

  const [content, supporterCount, paymentsVerified] = await Promise.all([
    getContentForVault(vault.id),
    vault.show_donation_total ? getSupporterCount(wallet) : Promise.resolve(0),
    creatorHasVerifiedPayments(wallet)
  ]);

  return (
    <CreatorProfileClient
      initialState={{
        vault,
        content: redactLockedContent(content, !vault.is_paid),
        hasAccess: !vault.is_paid,
        isOwner: false,
        isFavourite: false,
        supporterCount,
        subscription: null,
        expiredSubscription: null,
        paymentsVerified
      }}
    />
  );
}
