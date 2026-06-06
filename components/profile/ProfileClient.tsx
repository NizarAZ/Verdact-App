"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, ExternalLink, Heart, X } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { WalletAddress } from "@/components/shared/WalletAddress";
import { Skeleton } from "@/components/shared/Skeleton";
import { BackLink } from "@/components/ui/BackLink";
import { daysRemaining, formatAmount, formatDate, truncateMiddle } from "@/lib/format";
import { getShelbyTxnUrl } from "@/lib/shelby-explorer";

function downloadReceipt(item: any, type: "subscription" | "donation") {
  const receipt = {
    type,
    from: type === "subscription" ? item.subscriber_wallet : item.donor_wallet,
    to: item.creator_wallet,
    amount: type === "subscription" ? item.amount_paid : item.amount,
    asset: "ShelbyUSD",
    tx_hash: item.tx_hash,
    block_height: item.block_height ?? null,
    network: "Shelbynet",
    verified_at: type === "subscription" ? item.starts_at : item.created_at,
    verdact_version: "1.0"
  };
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `verdact-${type}-${item.tx_hash || item.id}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function PaymentActions({ item, type }: { item: any; type: "subscription" | "donation" }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {item.tx_hash ? (
        <a href={getShelbyTxnUrl(item.tx_hash)} target="_blank" rel="noreferrer" className="interactive-control inline-flex min-h-9 items-center gap-2 border border-base px-3 font-mono text-xs">
          View on Shelby Explorer <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
      <button type="button" onClick={() => downloadReceipt(item, type)} className="interactive-control inline-flex min-h-9 items-center gap-2 border border-base px-3 font-mono text-xs">
        <Download className="h-3.5 w-3.5" />
        Download Receipt
      </button>
    </div>
  );
}

function SubscriptionCard({ item, expired = false }: { item: any; expired?: boolean }) {
  const daysLeft = daysRemaining(item.expires_at);
  return (
    <article className="rounded-sm border border-base p-4">
      <Link href={`/creator/${item.creator_wallet}`} className="interactive-control block">
        <div className="mb-4 flex h-12 w-12 items-center justify-center overflow-hidden border border-base font-display text-3xl leading-none">
          <ShelbyBlobImage walletAddress={item.creator_wallet} blobId={item.creator?.avatar_blob_id} alt="" className="h-full w-full object-cover" fallback={(item.creator?.display_name || "V").slice(0, 1)} />
        </div>
        <h3 className="font-display text-3xl leading-none">{item.creator?.display_name || truncateMiddle(item.creator_wallet)}</h3>
        <p className="mt-2 text-sm text-text-tertiary">
          {item.creator?.category || "Other"} / {expired ? "expired" : "expires"} {formatDate(item.expires_at)} / {daysLeft} days
        </p>
      </Link>
      {daysLeft <= 7 || expired ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="border border-base px-2 py-1 font-mono text-xs text-brand">{expired ? "Expired" : `Expires in ${daysLeft} days`}</span>
          <Link href={`/subscribe/${item.creator_wallet}`} className="interactive-control inline-flex min-h-9 items-center border border-base px-3 font-mono text-xs">
            Renew
          </Link>
        </div>
      ) : null}
      <PaymentActions item={item} type="subscription" />
    </article>
  );
}

export function ProfileClient() {
  const { address, isConnected, walletFetch } = useWallet();
  const [data, setData] = useState<any | null>(null);

  async function load() {
    const response = await walletFetch("/api/profile", { cache: "no-store" });
    const json = await response.json();
    setData(json);
  }

  useEffect(() => {
    if (isConnected) void load();
  }, [isConnected]);

  async function unfavourite(creatorWallet: string) {
    await walletFetch("/api/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator_wallet: creatorWallet })
    });
    await load();
  }

  if (!isConnected) {
    return <main className="app-dashboard min-h-screen"><section className="container-shell py-8"><BackLink href="/" label="Back to marketplace" className="mb-8" /><WalletButton /></section></main>;
  }

  if (!data) {
    return (
      <main className="app-dashboard min-h-screen">
        <section className="container-shell py-8">
          <BackLink href="/" label="Back to marketplace" className="mb-8" />
          <div className="grid gap-3">
            <Skeleton height={44} width="220px" />
            <Skeleton height={140} />
            <Skeleton height={120} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-dashboard min-h-screen">
      <section className="container-shell py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <BackLink href="/" label="Back to marketplace" className="mb-5" />
            <h1 className="font-display text-5xl leading-none">Profile</h1>
          </div>
          <WalletButton compact />
        </div>

        <section className="section-surface overflow-hidden rounded-sm p-0">
          <div className="h-36 border-b border-base bg-[color:var(--color-surface-2)]">
            <ShelbyBlobImage walletAddress={address} blobId={data.vault?.cover_blob_id} alt="" className="h-full w-full object-cover" fallback={<div className="h-full bg-[linear-gradient(rgba(102,76,35,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(102,76,35,0.12)_1px,transparent_1px)] bg-[length:28px_28px]" />} />
          </div>
          <div className="p-5">
            <h2 className="font-display text-3xl leading-none">Identity</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden border border-base font-display text-4xl leading-none">
                <ShelbyBlobImage walletAddress={address} blobId={data.vault?.avatar_blob_id} alt="" className="h-full w-full object-cover" fallback={(data.vault?.display_name || "V").slice(0, 1)} />
              </div>
              <WalletAddress address={address} start={12} end={8} className="rounded-sm border border-base px-3 py-2 text-text-secondary" />
              <span className="font-mono text-xs text-text-tertiary">Member since {formatDate(data.memberSince)}</span>
            </div>
          </div>
        </section>

        <section className="mt-6 section-surface rounded-sm p-5">
          <h2 className="font-display text-3xl leading-none">Active subscriptions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(data.activeSubscriptions ?? []).length === 0 ? <p className="text-sm text-text-tertiary">No active subscriptions.</p> : null}
            {(data.activeSubscriptions ?? []).map((item: any) => <SubscriptionCard key={item.id} item={item} />)}
          </div>
        </section>

        <section className="mt-6 section-surface rounded-sm p-5">
          <h2 className="font-display text-3xl leading-none">Expired subscriptions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(data.expiredSubscriptions ?? []).length === 0 ? <p className="text-sm text-text-tertiary">No expired subscriptions.</p> : null}
            {(data.expiredSubscriptions ?? []).map((item: any) => <SubscriptionCard key={item.id} item={item} expired />)}
          </div>
        </section>

        <section className="mt-6 section-surface rounded-sm p-5">
          <h2 className="font-display text-3xl leading-none">Favourite creators</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(data.favourites ?? []).length === 0 ? <p className="text-sm text-text-tertiary">No favourites yet.</p> : null}
            {(data.favourites ?? []).map((item: any) => {
              const creator = item.creator;
              return (
                <article key={item.id} className="rounded-sm border border-base p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden border border-base font-display text-3xl leading-none">
                      <ShelbyBlobImage walletAddress={item.creator_wallet} blobId={creator?.avatar_blob_id} alt="" className="h-full w-full object-cover" fallback={(creator?.display_name || "V").slice(0, 1)} />
                    </div>
                    <Heart className="h-4 w-4 fill-[color:var(--color-pink)] text-[color:var(--color-pink)]" />
                  </div>
                  <Link href={`/creator/${item.creator_wallet}`} className="interactive-control mt-5 block font-display text-3xl leading-none">{creator?.display_name || truncateMiddle(item.creator_wallet)}</Link>
                  <button type="button" onClick={() => unfavourite(item.creator_wallet)} className="interactive-control mt-4 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-base" aria-label="Unfavourite">
                    <X className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 section-surface rounded-sm p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl leading-none">Donation history</h2>
            <span className="font-mono text-xs text-brand">{formatAmount(data.totalDonated)} ShelbyUSD lifetime</span>
          </div>
          <div className="mt-4 grid gap-2">
            {(data.donations ?? []).map((item: any) => (
              <div key={item.id} className="rounded-sm border border-base p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-text-secondary">{item.creator?.display_name || truncateMiddle(item.creator_wallet)}</span>
                  <span className="font-mono text-xs text-brand">{formatAmount(item.amount)}</span>
                </div>
                {item.message ? <p className="mt-2 text-sm text-text-tertiary">{item.message}</p> : null}
                <PaymentActions item={item} type="donation" />
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
