"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { BackLink } from "@/components/ui/BackLink";
import { amountToMicroUnits } from "@/lib/amount";
import { formatAmount, truncateMiddle } from "@/lib/format";
import { createShelbyUsdTransferPayload } from "@/lib/shelby-browser";
import type { ContentRecord, VaultRecord } from "@/lib/supabase-server";

export function SubscribePageClient({ vault, previews }: { vault: VaultRecord; previews: ContentRecord[] }) {
  const router = useRouter();
  const { isConnected, signAndSubmitTransaction, walletFetch } = useWallet();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe() {
    setBusy(true);
    setStatus("");
    try {
      const amountMicroUnits = amountToMicroUnits(vault.price_monthly).toString();
      const tx = await signAndSubmitTransaction(createShelbyUsdTransferPayload({
        creatorWallet: vault.wallet_address,
        amountMicroUnits
      }));
      const response = await walletFetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_wallet: vault.wallet_address,
          tx_hash: tx.hash
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Subscription failed.");
      router.push(`/creator/${vault.wallet_address}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-dashboard min-h-screen">
      <section className="container-shell py-8">
        <div className="mb-8 flex items-center justify-between">
          <BackLink href={`/creator/${vault.wallet_address}`} label="Back to creator" />
          <WalletButton compact />
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="section-surface rounded-sm p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-sm border border-base bg-[color:var(--color-surface-2)] font-display text-4xl">
              {(vault.display_name || "V").slice(0, 1)}
            </div>
            <h1 className="mt-6 font-display text-6xl leading-none">{vault.display_name || "Untitled creator"}</h1>
            <p className="mt-2 font-mono text-xs text-text-tertiary">{truncateMiddle(vault.wallet_address, 12, 8)}</p>
            <p className="mt-5 text-text-secondary">{vault.bio || "No bio yet."}</p>
            <div className="mt-8 border-t border-base pt-6">
              <p className="font-display text-5xl leading-none">{formatAmount(vault.price_monthly)} ShelbyUSD</p>
              <p className="mt-2 font-mono text-xs text-text-tertiary">per month / wallet-to-wallet</p>
            </div>
            <div className="mt-8">
              {isConnected ? (
                <button type="button" onClick={subscribe} disabled={busy} className="interactive-control min-h-12 w-full rounded-sm bg-brand px-4 font-mono text-sm text-brand-dark disabled:opacity-50">
                  {busy ? "Confirming payment" : `Subscribe for ${formatAmount(vault.price_monthly)} ShelbyUSD/month`}
                </button>
              ) : (
                <WalletButton />
              )}
              {status ? <p className="mt-4 text-sm text-text-secondary">{status}</p> : null}
            </div>
          </section>

          <section className="section-surface rounded-sm p-6">
            <h2 className="font-display text-4xl leading-none">Preview content</h2>
            <div className="mt-5 grid gap-3">
              {previews.length === 0 ? (
                <div className="rounded-sm border border-base p-5 text-sm text-text-tertiary">No preview files yet.</div>
              ) : (
                previews.map((item) => (
                  <article key={item.id} className="flex items-center justify-between gap-3 rounded-sm border border-base p-4">
                    <div>
                      <h3 className="font-display text-2xl leading-none">{item.title}</h3>
                      <p className="mt-1 text-sm text-text-tertiary">{item.description || item.file_type}</p>
                    </div>
                    <Lock className="h-4 w-4 text-text-tertiary" />
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
