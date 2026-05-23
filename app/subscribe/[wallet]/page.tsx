import { notFound } from "next/navigation";
import { SubscribePageClient } from "@/components/creator/SubscribePageClient";
import { getContentForVault, getVaultByWallet } from "@/lib/supabase-server";
import { normalizeWalletAddress } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export default async function SubscribePage({ params }: { params: { wallet: string } }) {
  const wallet = normalizeWalletAddress(params.wallet);
  if (!wallet) notFound();
  const vault = await getVaultByWallet(wallet);
  if (!vault || !vault.is_paid) notFound();
  const content = await getContentForVault(vault.id);
  return <SubscribePageClient vault={vault} previews={content.filter((item) => item.is_preview)} />;
}
