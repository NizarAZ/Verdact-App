"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Download, FileText, Heart, Image as ImageIcon, Lock, Music, Play, ShieldCheck, X } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { PublicNav } from "@/components/marketplace/PublicNav";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { BackLink } from "@/components/ui/BackLink";
import { createBlobObjectUrl, createShelbyUsdTransferPayload, readShelbyBlob } from "@/lib/shelby-browser";
import { amountToMicroUnits } from "@/lib/amount";
import { formatAmount, formatDate, truncateMiddle } from "@/lib/format";
import { getShelbyBlobUrl } from "@/lib/shelby-explorer";
import { WalletAddress } from "@/components/shared/WalletAddress";
import type { ContentRecord, SubscriptionRecord, VaultRecord } from "@/lib/supabase-server";

type CreatorState = {
  vault: VaultRecord;
  content: ContentRecord[];
  hasAccess: boolean;
  isOwner: boolean;
  isFavourite: boolean;
  supporterCount: number;
  subscription?: SubscriptionRecord | null;
  expiredSubscription?: SubscriptionRecord | null;
  paymentsVerified?: boolean;
};

const donationPresets = [0.01, 0.05, 0.1, 0.5, 1];

function contentIcon(fileType?: string | null) {
  if (fileType?.startsWith("video/")) return Play;
  if (fileType?.startsWith("audio/")) return Music;
  if (fileType?.startsWith("image/")) return ImageIcon;
  return FileText;
}

function canViewContent(state: CreatorState, item: ContentRecord) {
  return state.hasAccess || item.is_preview;
}

function Viewer({ item, onClose }: { item: ContentRecord; onClose: () => void }) {
  const { walletFetch } = useWallet();
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let currentUrl: string | null = null;
    let mounted = true;

    async function load() {
      try {
        if (!item.blob_id) throw new Error("Missing Shelby blob.");
        const bytes = await readShelbyBlob({ walletAddress: item.wallet_address, blobName: item.blob_id });
        currentUrl = createBlobObjectUrl(bytes, item.file_type);
        if (!mounted) return;
        if (item.file_type?.startsWith("text/") || item.file_type === "application/json" || item.file_name?.endsWith(".md")) {
          setText(new TextDecoder().decode(bytes));
        }
        setUrl(currentUrl);
        await walletFetch(`/api/content/${item.id}/view`, { method: "POST" }).catch(() => undefined);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Unable to load content.");
      }
    }

    load();
    return () => {
      mounted = false;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [item, retry, walletFetch]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl flex-col rounded-sm border border-base bg-[color:var(--color-bg)]">
        <div className="flex items-center justify-between border-b border-base p-4">
          <div>
            <h2 className="font-display text-3xl leading-none">{item.title}</h2>
            <p className="mt-1 font-mono text-xs text-text-tertiary">{item.file_type || item.file_name}</p>
          </div>
          <button type="button" onClick={onClose} className="interactive-control inline-flex h-10 w-10 items-center justify-center rounded-sm border border-base">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          {error ? (
            <div className="blob-error max-w-md border border-base p-5 text-center">
              <p className="font-display text-3xl leading-none">Content temporarily unavailable.</p>
              <p className="mt-3 text-sm leading-6 text-text-tertiary">The file may still be propagating on Shelby.</p>
              <p className="mt-3 font-mono text-xs text-brand">{error}</p>
              <button type="button" onClick={() => { setError(""); setUrl(null); setText(null); setRetry((value) => value + 1); }} className="interactive-control mt-4 border border-base px-4 py-2 font-mono text-xs">
                Retry
              </button>
            </div>
          ) : !url ? <p className="font-mono text-sm text-text-tertiary">Loading from Shelby</p> : null}
          {url && item.file_type?.startsWith("video/") ? <video src={url} controls className="max-h-full w-full" /> : null}
          {url && item.file_type?.startsWith("audio/") ? <audio src={url} controls className="w-full" /> : null}
          {url && item.file_type?.startsWith("image/") ? <img src={url} alt={item.title} className="max-h-full max-w-full" /> : null}
          {url && item.file_type === "application/pdf" ? <iframe src={url} title={item.title} className="h-full min-h-[70vh] w-full" /> : null}
          {url && text ? <pre className="w-full whitespace-pre-wrap font-mono text-sm leading-6 text-text-primary">{text}</pre> : null}
          {url && !text && !item.file_type?.startsWith("video/") && !item.file_type?.startsWith("audio/") && !item.file_type?.startsWith("image/") && item.file_type !== "application/pdf" ? (
            <a href={url} download={item.file_name || item.title} className="interactive-control rounded-sm bg-brand px-4 py-3 font-mono text-sm text-brand-dark">
              Open file
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DonationModal({ state, onClose }: { state: CreatorState; onClose: () => void }) {
  const { isConnected, signAndSubmitTransaction, walletFetch } = useWallet();
  const [amount, setAmount] = useState("1");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function donate() {
    setBusy(true);
    setStatus("");
    try {
      const microUnits = amountToMicroUnits(amount).toString();
      const tx = await signAndSubmitTransaction(createShelbyUsdTransferPayload({
        creatorWallet: state.vault.wallet_address,
        amountMicroUnits: microUnits
      }));
      const response = await walletFetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_wallet: state.vault.wallet_address,
          amount,
          message,
          tx_hash: tx.hash
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Donation failed.");
      setStatus(`Donation confirmed: ${truncateMiddle(tx.hash)}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Donation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-sm border border-base bg-[color:var(--color-bg)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-4xl leading-none">Donate to {state.vault.display_name || "creator"}</p>
            <p className="mt-2 text-sm text-text-tertiary">ShelbyUSD goes directly to the creator wallet.</p>
          </div>
          <button type="button" onClick={onClose} className="interactive-control inline-flex h-9 w-9 items-center justify-center rounded-sm border border-base">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {donationPresets.map((preset) => (
            <button key={preset} type="button" onClick={() => setAmount(String(preset))} className={`interactive-control rounded-sm border px-3 py-2 font-mono text-sm ${amount === String(preset) ? "border-brand text-brand" : "border-base"}`}>
              {preset} ShelbyUSD
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm">
          <span className="text-text-secondary">Custom amount</span>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-sm border border-base bg-transparent px-3 py-3 font-mono outline-none focus:border-brand" />
        </label>
        <label className="mt-4 block text-sm">
          <span className="text-text-secondary">Leave a note for the creator (optional)</span>
          <textarea value={message} maxLength={280} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-24 w-full rounded-sm border border-base bg-transparent px-3 py-3 outline-none focus:border-brand" />
        </label>
        <div className="mt-5">
          {isConnected ? (
            <button type="button" onClick={donate} disabled={busy} className="interactive-control min-h-11 w-full rounded-sm bg-brand px-4 font-mono text-sm text-brand-dark disabled:opacity-50">
              {busy ? "Confirming" : "Donate"}
            </button>
          ) : (
            <WalletButton />
          )}
        </div>
        {status ? <p className="mt-4 text-sm text-text-secondary">{status}</p> : null}
      </div>
    </div>
  );
}

export function CreatorProfileClient({ initialState }: { initialState: CreatorState }) {
  const { isConnected, walletFetch } = useWallet();
  const [state, setState] = useState(initialState);
  const [viewerItem, setViewerItem] = useState<ContentRecord | null>(null);
  const [donating, setDonating] = useState(false);
  const [notice, setNotice] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    let active = true;
    const stateUrl = `/api/creators/${encodeURIComponent(initialState.vault.wallet_address)}/state`;

    async function refreshCreatorState() {
      try {
        const response = await walletFetch(stateUrl, { cache: "no-store" });
        const json = await response.json();
        if (active && json.vault) setState(json);
      } catch {
        // Keep the rendered storefront usable if a background refresh fails.
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshCreatorState();
    }

    void refreshCreatorState();
    window.addEventListener("focus", refreshCreatorState);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const interval = window.setInterval(refreshCreatorState, 12000);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshCreatorState);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, [initialState.vault.wallet_address, walletFetch]);

  async function toggleFavourite() {
    if (!isConnected) {
      setNotice("Connect Petra to favourite this creator.");
      return;
    }
    const next = !state.isFavourite;
    setState((current) => ({ ...current, isFavourite: next }));
    await walletFetch("/api/favourites", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator_wallet: state.vault.wallet_address })
    }).catch(() => setState((current) => ({ ...current, isFavourite: !next })));
  }

  async function downloadContent(item: ContentRecord) {
    if (!canViewContent(state, item)) {
      setNotice("Subscribe to unlock downloads for this vault item.");
      return;
    }
    if (!item.blob_id) {
      setNotice("This item has no Shelby blob attached.");
      return;
    }

    setDownloadingId(item.id);
    setNotice("");
    let url: string | null = null;
    try {
      const bytes = await readShelbyBlob({ walletAddress: item.wallet_address, blobName: item.blob_id });
      url = createBlobObjectUrl(bytes, item.file_type);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.file_name || item.title || "verdact-file";
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      setNotice(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  }

  const publicContent = useMemo(() => state.content, [state.content]);
  const visibleContent = useMemo(() => publicContent.slice(0, visibleCount), [publicContent, visibleCount]);
  const previewCount = useMemo(() => state.content.filter((item) => item.is_preview).length, [state.content]);
  const lockedCount = useMemo(() => state.content.filter((item) => !canViewContent(state, item)).length, [state]);

  return (
    <main className="shelby-page market-page min-h-screen overflow-hidden">
      <PublicNav />
      <section className="container-shell pb-16 pt-8">
        <div className="mb-6">
          <BackLink href="/" label="Back to marketplace" />
        </div>

        <header className="market-panel overflow-hidden">
          <div className="relative h-48 border-b border-[color:var(--market-border)] bg-[color:var(--market-surface-strong)] md:h-64">
            {state.vault.cover_blob_id ? (
              <ShelbyBlobImage
                walletAddress={state.vault.wallet_address}
                blobId={state.vault.cover_blob_id}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                fallback={<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:34px_34px]" />}
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:34px_34px]" />
            )}
            {!state.vault.cover_blob_id ? <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[color:var(--market-bg)]" /> : null}
            {!state.vault.cover_blob_id ? <div className="pointer-events-none absolute right-8 top-8 h-32 w-24 rotate-3 border border-[color:var(--market-line)] bg-[color:var(--market-paper)]">
              <div className="m-3 h-2 bg-[color:var(--market-accent)]" />
              <div className="mx-3 mt-3 h-1 bg-[color:var(--market-ink)] opacity-30" />
              <div className="mx-3 mt-2 h-1 bg-[color:var(--market-ink)] opacity-25" />
              <div className="mx-3 mt-3 h-10 border border-[color:var(--market-accent)]" />
            </div> : null}
          </div>
          <div className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-[color:var(--market-border)] bg-[color:var(--market-bg)] font-display text-6xl leading-none">
                <ShelbyBlobImage
                  walletAddress={state.vault.wallet_address}
                  blobId={state.vault.avatar_blob_id}
                  alt=""
                  className="h-full w-full object-cover"
                  fallback={(state.vault.display_name || "V").slice(0, 1)}
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-7xl leading-none">{state.vault.display_name || "Untitled creator"}</h1>
                  <button type="button" onClick={toggleFavourite} className="interactive-control inline-flex h-10 w-10 items-center justify-center border border-base" aria-label="Toggle favourite">
                    <Heart className={`h-4 w-4 ${state.isFavourite ? "fill-[color:var(--color-pink)] text-[color:var(--color-pink)]" : ""}`} />
                  </button>
                </div>
                <WalletAddress address={state.vault.wallet_address} start={12} end={8} className="mt-2 text-text-tertiary" />
                <p className="mt-4 max-w-2xl text-text-secondary">{state.vault.bio || "No bio yet."}</p>
                <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                  <span className="rounded-sm border border-base px-2 py-1">{state.vault.category || "Other"}</span>
                  <span className="rounded-sm border border-base px-2 py-1">{state.vault.is_paid ? `${formatAmount(state.vault.price_monthly)} ShelbyUSD/month` : "FREE"}</span>
                  {state.paymentsVerified ? <span className="inline-flex items-center gap-1 rounded-sm border border-base px-2 py-1 text-brand"><ShieldCheck className="h-3.5 w-3.5" /> Payments verified on Shelbynet</span> : null}
                  {state.vault.show_donation_total && !state.vault.is_paid ? <span className="rounded-sm border border-base px-2 py-1">{state.supporterCount} supporters</span> : null}
                </div>
              </div>
            </div>
            {state.vault.is_paid ? (
              state.hasAccess && !state.isOwner ? (
                <div className="grid gap-2 text-left md:text-right">
                  <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-sm border border-base px-4 font-mono text-sm text-text-primary opacity-80">
                    Subscribed
                  </button>
                  {state.subscription?.expires_at ? (
                    <p className="font-mono text-xs text-text-tertiary">Ends {formatDate(state.subscription.expires_at)}</p>
                  ) : null}
                </div>
              ) : state.isOwner ? (
                <Link href="/vault" className="interactive-control inline-flex min-h-11 items-center justify-center rounded-sm border border-base px-4 font-mono text-sm text-text-primary">
                  Manage vault
                </Link>
              ) : (
                <Link href={`/subscribe/${state.vault.wallet_address}`} className="interactive-control inline-flex min-h-11 items-center justify-center rounded-sm bg-brand px-4 font-mono text-sm text-brand-dark">
                  Subscribe
                </Link>
              )
            ) : (
              <button type="button" onClick={() => setDonating(true)} className="interactive-control inline-flex min-h-11 items-center justify-center rounded-sm bg-brand px-4 font-mono text-sm text-brand-dark">
                Donate
              </button>
            )}
          </div>
          {notice ? <p className="mt-5 font-mono text-xs text-text-tertiary">{notice}</p> : null}
          {state.expiredSubscription ? (
            <div className="mt-5 border border-base bg-[color:var(--market-surface-strong)] p-4">
              <p className="font-display text-3xl leading-none">Your subscription expired. Renew to access locked content.</p>
              <Link href={`/subscribe/${state.vault.wallet_address}`} className="interactive-control mt-3 inline-flex min-h-10 items-center bg-brand px-4 font-mono text-xs text-brand-dark">
                Renew
              </Link>
            </div>
          ) : null}
          <div className="mt-6 grid border border-base md:grid-cols-4">
            {[
              ["files", publicContent.length],
              ["previews", previewCount],
              ["locked", lockedCount],
              [state.vault.is_paid ? "price" : "supporters", state.vault.is_paid ? `${formatAmount(state.vault.price_monthly)}` : state.supporterCount]
            ].map(([label, value]) => (
              <div key={String(label)} className="border-b border-r border-base p-4 last:border-r-0 md:border-b-0">
                <p className="font-display text-4xl leading-none">{value}</p>
                <p className="mt-1 font-mono text-[10px] text-text-tertiary">{label}</p>
              </div>
            ))}
          </div>
          </div>
        </header>

        <section className="market-panel mt-6 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-xs text-[color:var(--market-accent)]">FAVOURITE CREATORS</p>
              <h2 className="mt-3 font-display text-4xl leading-none">Save storefronts with the heart icon.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-tertiary">
                Favourite this creator to keep the storefront in your profile and return to it from your personal marketplace list.
              </p>
            </div>
            <button type="button" onClick={toggleFavourite} className="interactive-control inline-flex min-h-11 items-center gap-3 border border-base px-4 font-mono text-sm">
              <Heart className={`h-4 w-4 ${state.isFavourite ? "fill-[color:var(--color-pink)] text-[color:var(--color-pink)]" : "text-text-tertiary"}`} />
              {state.isFavourite ? "Saved to favourites" : "Add favourite"}
            </button>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-5xl leading-none">Content feed</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-tertiary">
              Preview listings are public. Paid vault blobs only open after an active subscription is verified.
            </p>
          </div>
          {state.vault.is_paid && !state.hasAccess ? (
            <Link href={`/subscribe/${state.vault.wallet_address}`} className="interactive-control inline-flex min-h-11 items-center justify-center rounded-sm border border-brand px-4 font-mono text-sm text-brand">
              Unlock full vault
            </Link>
          ) : null}
        </div>

        <section className="mt-6 grid gap-5">
          {visibleContent.map((item) => {
            const Icon = contentIcon(item.file_type);
            const viewable = canViewContent(state, item);
            return (
              <article key={item.id} className="market-card grid overflow-hidden md:grid-cols-[0.55fr_1fr]">
                <div className="relative min-h-64 border-b border-[color:var(--market-border)] bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:28px_28px] md:border-b-0 md:border-r">
                  {item.thumbnail_blob_id ? (
                    <ShelbyBlobImage
                      walletAddress={item.wallet_address}
                      blobId={item.thumbnail_blob_id}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  {!item.thumbnail_blob_id ? <div className="absolute inset-0 flex items-center justify-center">
                    {viewable ? <Icon className="h-8 w-8 text-[color:var(--color-pink)]" /> : <Lock className="h-8 w-8 text-text-tertiary" />}
                  </div> : null}
                  {!viewable ? <div className="pointer-events-none absolute bottom-4 right-4 border border-base bg-[color:var(--color-bg)] px-3 py-2 font-mono text-[10px] text-text-tertiary">subscription required</div> : null}
                </div>
                <div className="flex min-h-64 flex-col p-5">
                  <div className="flex flex-wrap gap-2 font-mono text-[10px] text-text-tertiary">
                    <span className="border border-base px-2 py-1">{item.file_type || "file"}</span>
                    <span className="border border-base px-2 py-1">{formatDate(item.created_at)}</span>
                    <span className="border border-base px-2 py-1 text-brand">{item.is_preview ? "PREVIEW" : viewable ? "UNLOCKED" : "LOCKED"}</span>
                  </div>
                  <h2 className="mt-8 font-display text-5xl leading-none">{item.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-text-tertiary">{item.description || "No description added yet."}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-8">
                    <button type="button" disabled={!viewable} onClick={() => setViewerItem(item)} className="interactive-control inline-flex min-h-10 flex-1 items-center justify-center gap-2 border border-base px-3 font-mono text-xs disabled:cursor-not-allowed disabled:opacity-40">
                      {viewable ? "Open" : "Locked"} {viewable ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
                    </button>
                    {viewable && item.allow_download ? (
                      <button type="button" onClick={() => downloadContent(item)} disabled={downloadingId === item.id} className="interactive-control inline-flex h-10 w-10 items-center justify-center border border-base disabled:cursor-wait disabled:opacity-60" aria-label="Download">
                        <Download className="h-4 w-4" />
                      </button>
                    ) : null}
                    {state.isOwner && item.blob_id ? (
                      <a href={getShelbyBlobUrl(item.blob_id)} target="_blank" rel="noreferrer" className="interactive-control inline-flex min-h-10 items-center justify-center border border-base px-3 font-mono text-xs text-text-tertiary">
                        View on Shelby
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
        {visibleCount < publicContent.length ? (
          <div className="mt-6 flex justify-center">
            <button type="button" onClick={() => setVisibleCount((count) => count + 4)} className="interactive-control inline-flex min-h-11 items-center border border-base px-5 font-mono text-sm">
              Load more content
            </button>
          </div>
        ) : null}
        {publicContent.length === 0 ? (
          <div className="market-panel mt-6 overflow-hidden p-8">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                <p className="font-display text-6xl leading-none">The storefront is open. The first drop is still loading.</p>
                <p className="mt-4 max-w-lg text-sm leading-6 text-text-tertiary">When this creator publishes preview files or locked vault items, they will appear here as Shelby-backed content cards.</p>
              </div>
              <div className="min-h-56 border border-[color:var(--market-border)] bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:30px_30px]" />
            </div>
          </div>
        ) : null}
      </section>
      {viewerItem ? <Viewer item={viewerItem} onClose={() => setViewerItem(null)} /> : null}
      {donating ? <DonationModal state={state} onClose={() => setDonating(false)} /> : null}
    </main>
  );
}
