"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Heart, X } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { BackLink } from "@/components/ui/BackLink";
import { daysRemaining, formatAmount, formatDate, truncateMiddle } from "@/lib/format";

export function ProfileClient() {
  const { address, isConnected, walletFetch } = useWallet();
  const [data, setData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

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

  function copyAddress() {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (!isConnected) {
    return <main className="app-dashboard min-h-screen"><section className="container-shell py-8"><BackLink href="/" label="Back to marketplace" className="mb-8" /><WalletButton /></section></main>;
  }

  if (!data) return <main className="app-dashboard min-h-screen"><section className="container-shell py-8"><BackLink href="/" label="Back to marketplace" className="mb-8" /><p className="font-mono text-sm text-text-tertiary">Loading profile</p></section></main>;

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
            <ShelbyBlobImage
              walletAddress={address}
              blobId={data.vault?.cover_blob_id}
              alt=""
              className="h-full w-full object-cover"
              fallback={<div className="h-full bg-[linear-gradient(rgba(102,76,35,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(102,76,35,0.12)_1px,transparent_1px)] bg-[length:28px_28px]" />}
            />
          </div>
          <div className="p-5">
            <h2 className="font-display text-3xl leading-none">Identity</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden border border-base font-display text-4xl leading-none">
                <ShelbyBlobImage
                  walletAddress={address}
                  blobId={data.vault?.avatar_blob_id}
                  alt=""
                  className="h-full w-full object-cover"
                  fallback={(data.vault?.display_name || "V").slice(0, 1)}
                />
              </div>
              <span className="rounded-sm border border-base px-3 py-2 font-mono text-xs">{truncateMiddle(address, 12, 8)}</span>
              <button type="button" onClick={copyAddress} className="interactive-control inline-flex h-9 w-9 items-center justify-center rounded-sm border border-base" aria-label={copied ? "Wallet address copied" : "Copy wallet address"}>
                <Copy className="h-4 w-4" />
              </button>
              {copied ? <span className="font-mono text-xs text-brand">Copied</span> : null}
              <span className="font-mono text-xs text-text-tertiary">Member since {formatDate(data.memberSince)}</span>
            </div>
          </div>
        </section>

        <section className="mt-6 section-surface rounded-sm p-5">
          <h2 className="font-display text-3xl leading-none">Active subscriptions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(data.activeSubscriptions ?? []).length === 0 ? <p className="text-sm text-text-tertiary">No active subscriptions.</p> : null}
            {(data.activeSubscriptions ?? []).map((item: any) => (
              <Link key={item.id} href={`/creator/${item.creator_wallet}`} className="interactive-control rounded-sm border border-base p-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center overflow-hidden border border-base font-display text-3xl leading-none">
                  <ShelbyBlobImage walletAddress={item.creator_wallet} blobId={item.creator?.avatar_blob_id} alt="" className="h-full w-full object-cover" fallback={(item.creator?.display_name || "V").slice(0, 1)} />
                </div>
                <h3 className="font-display text-3xl leading-none">{item.creator?.display_name || truncateMiddle(item.creator_wallet)}</h3>
                <p className="mt-2 text-sm text-text-tertiary">{item.creator?.category || "Other"} / expires {formatDate(item.expires_at)} / {daysRemaining(item.expires_at)} days</p>
              </Link>
            ))}
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
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
