import { notFound } from "next/navigation";
import { CreatorProfileClient } from "@/components/creator/CreatorProfileClient";
import { getContentForVault, getSupporterCount, getVaultByWallet } from "@/lib/supabase-server";
import { normalizeWalletAddress } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export default async function CreatorPage({ params }: { params: { wallet: string } }) {
  const wallet = normalizeWalletAddress(params.wallet);
  if (!wallet) notFound();

  const vault = await getVaultByWallet(wallet);
  if (!vault) notFound();

  const [content, supporterCount] = await Promise.all([
    getContentForVault(vault.id),
    vault.show_donation_total ? getSupporterCount(wallet) : Promise.resolve(0)
  ]);

  return (
    <CreatorProfileClient
      initialState={{
        vault,
        content,
        hasAccess: !vault.is_paid,
        isOwner: false,
        isFavourite: false,
        supporterCount
      }}
    />
  );
}
