"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, FileText, Gift, LineChart, Plus, Radio, Settings, Share2, Trash2, Upload, Users } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { BackLink } from "@/components/ui/BackLink";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { categories } from "@/lib/constants";
import { formatAmount, formatDate, truncateMiddle } from "@/lib/format";
import { createBlobObjectUrl, readShelbyBlob } from "@/lib/shelby-browser";

type VaultPayload = {
  vault: any | null;
  content?: Array<any>;
  donations?: Array<any>;
  stats?: {
    subscribers: number;
    earnings: number;
    contentItems: number;
    views: number;
  };
};

function VaultTopbar({ address }: { address?: string | null }) {
  return (
    <header className="vault-topbar">
      <nav className="container-shell flex min-h-[64px] items-center justify-between gap-4">
        <Link href="/" className="interactive-control font-display text-3xl leading-none">Verdact</Link>
        <div className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
          <Link href="/" className="interactive-control hidden hover:text-text-primary sm:inline">Marketplace</Link>
          <Link href="/vault/upload" className="interactive-control hidden hover:text-text-primary sm:inline">Upload</Link>
          <Link href="/vault/analytics" className="interactive-control hidden hover:text-text-primary sm:inline">Analytics</Link>
          {address ? <span className="border border-base px-3 py-2">{truncateMiddle(address, 8, 6)}</span> : <WalletButton compact />}
        </div>
      </nav>
    </header>
  );
}

function VaultForm({ onSaved }: { onSaved: () => void }) {
  const { walletFetch } = useWallet();
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    category: "Other",
    is_paid: false,
    price_monthly: "5"
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await walletFetch("/api/vault/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to create vault.");
      onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create vault.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vault-page min-h-screen">
      <VaultTopbar />
      <section className="container-shell grid min-h-[calc(100vh-64px)] items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <BackLink href="/" label="Back to marketplace" className="mb-8" />
          <p className="font-mono text-sm text-brand">CREATOR WORKSPACE SETUP</p>
          <h1 className="mt-5 max-w-3xl font-display text-7xl leading-none text-text-primary">Turn your wallet into a public storefront.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-text-tertiary">
            Create the metadata layer for your Shelby content: public profile, pricing mode, category, and storefront identity.
          </p>
        </div>
        <form onSubmit={submit} className="vault-panel p-6">
          <div className="grid gap-4">
            <label className="block text-sm text-text-secondary">
              Display name
              <input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className="mt-2 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" required />
            </label>
            <label className="block text-sm text-text-secondary">
              Bio
              <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="mt-2 min-h-28 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <StyledSelect label="Category" value={form.category} options={categories} onChange={(category) => setForm({ ...form, category })} />
              <label className="flex items-center justify-between border border-base p-3 text-sm text-text-secondary">
                Paid vault
                <input type="checkbox" checked={form.is_paid} onChange={(event) => setForm({ ...form, is_paid: event.target.checked })} />
              </label>
            </div>
            {form.is_paid ? (
              <label className="block text-sm text-text-secondary">
                Monthly price
                <input value={form.price_monthly} onChange={(event) => setForm({ ...form, price_monthly: event.target.value })} className="mt-2 w-full border border-base bg-transparent px-3 py-3 font-mono text-text-primary outline-none focus:border-brand" />
              </label>
            ) : null}
          </div>
          <button type="submit" disabled={busy} className="interactive-control mt-6 min-h-12 bg-brand px-5 font-mono text-sm text-brand-dark disabled:opacity-50">
            {busy ? "Creating vault" : "Create vault"}
          </button>
          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

function EmptyState({ title, body, action, href, icon: Icon = FileText }: { title: string; body: string; action: string; href: string; icon?: any }) {
  return (
    <div className="vault-empty p-6">
      <Icon className="h-7 w-7 text-brand" />
      <p className="mt-10 max-w-lg font-display text-4xl leading-none text-text-primary">{title}</p>
      <p className="mt-4 max-w-md text-sm leading-6 text-text-tertiary">{body}</p>
      <Link href={href} className="interactive-control relative z-10 mt-6 inline-flex min-h-10 items-center gap-2 bg-brand px-4 font-mono text-xs text-brand-dark">
        {action}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function FileKind({ fileType }: { fileType?: string | null }) {
  const label = fileType?.split("/")[0]?.toUpperCase() || "FILE";
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-base bg-[color:var(--vault-bg)] font-mono text-[10px] text-brand">
      {label.slice(0, 5)}
    </div>
  );
}

function VaultContentViewer({ item, onClose }: { item: any; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;

    async function load() {
      try {
        if (!item.blob_id) throw new Error("Missing Shelby blob.");
        const bytes = await readShelbyBlob({ walletAddress: item.wallet_address, blobName: item.blob_id });
        objectUrl = createBlobObjectUrl(bytes, item.file_type);
        if (!active) return;
        if (item.file_type?.startsWith("text/") || item.file_type === "application/json" || item.file_name?.endsWith(".md")) {
          setText(new TextDecoder().decode(bytes));
        }
        setUrl(objectUrl);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load content.");
      }
    }

    void load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl flex-col border border-base bg-[color:var(--color-bg)]">
        <div className="flex items-start justify-between gap-4 border-b border-base p-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-4xl leading-none">{item.title}</h2>
            <p className="mt-1 truncate font-mono text-xs text-text-tertiary">{item.file_name || item.file_type || "file"}</p>
          </div>
          <button type="button" onClick={onClose} className="interactive-control shrink-0 border border-base px-3 py-2 font-mono text-xs">
            Close
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          {error ? <p className="text-sm text-red-400">{error}</p> : !url ? <p className="font-mono text-sm text-text-tertiary">Loading from Shelby</p> : null}
          {url && item.file_type?.startsWith("video/") ? <video src={url} controls className="max-h-full w-full" /> : null}
          {url && item.file_type?.startsWith("audio/") ? <audio src={url} controls className="w-full" /> : null}
          {url && item.file_type?.startsWith("image/") ? <img src={url} alt={item.title} className="max-h-full max-w-full" /> : null}
          {url && item.file_type === "application/pdf" ? <iframe src={url} title={item.title} className="h-full min-h-[70vh] w-full" /> : null}
          {url && text ? <pre className="w-full whitespace-pre-wrap font-mono text-sm leading-6 text-text-primary">{text}</pre> : null}
          {url && !text && !item.file_type?.startsWith("video/") && !item.file_type?.startsWith("audio/") && !item.file_type?.startsWith("image/") && item.file_type !== "application/pdf" ? (
            <a href={url} download={item.file_name || item.title} className="interactive-control bg-brand px-4 py-3 font-mono text-sm text-brand-dark">
              Download file
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContentSettingsModal({
  item,
  onClose,
  onSaved
}: {
  item: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { walletFetch } = useWallet();
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(item.description || "");
  const [allowDownload, setAllowDownload] = useState(item.allow_download !== false);
  const [isPreview, setIsPreview] = useState(Boolean(item.is_preview));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await walletFetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          allow_download: allowDownload,
          is_preview: isPreview
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to update file settings.");
      await onSaved();
      onClose();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update file settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[85] bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={save} className="mx-auto mt-10 max-w-2xl border border-base bg-[color:var(--color-bg)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-4xl leading-none">File settings</p>
            <p className="mt-2 truncate font-mono text-xs text-text-tertiary">{item.file_name || item.blob_id || "Shelby file"}</p>
          </div>
          <button type="button" onClick={onClose} className="interactive-control shrink-0 border border-base px-3 py-2 font-mono text-xs">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="block text-sm text-text-secondary">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" required />
          </label>
          <label className="block text-sm text-text-secondary">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
          </label>
          <label className="vault-fieldset flex items-center justify-between p-4 text-sm text-text-secondary">
            <span>Allow download</span>
            <input type="checkbox" checked={allowDownload} onChange={(event) => setAllowDownload(event.target.checked)} />
          </label>
          <label className="vault-fieldset flex items-center justify-between p-4 text-sm text-text-secondary">
            <span>Show as public preview listing</span>
            <input type="checkbox" checked={isPreview} onChange={(event) => setIsPreview(event.target.checked)} />
          </label>
        </div>

        <button type="submit" disabled={busy} className="interactive-control mt-5 min-h-12 w-full bg-brand px-4 font-mono text-sm text-brand-dark disabled:opacity-50">
          {busy ? "Saving" : "Save file settings"}
        </button>
        {status ? <p className="mt-4 text-sm text-red-400">{status}</p> : null}
      </form>
    </div>
  );
}

export function VaultClient() {
  const { address, isConnected, walletFetch } = useWallet();
  const [payload, setPayload] = useState<VaultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [viewerItem, setViewerItem] = useState<any | null>(null);
  const [settingsItem, setSettingsItem] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await walletFetch("/api/vault/me", { cache: "no-store" });
      const json = await response.json();
      setPayload(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isConnected) void load();
  }, [isConnected]);

  async function removeContent(id: string) {
    await walletFetch(`/api/content/${id}`, { method: "DELETE" });
    await load();
  }

  const stats = payload?.stats ?? { subscribers: 0, earnings: 0, contentItems: 0, views: 0 };
  const content = payload?.content ?? [];
  const donations = payload?.donations ?? [];
  const vault = payload?.vault;
  const latestContent = content.slice(0, 6);
  const previewCount = useMemo(() => content.filter((item) => item.is_preview).length, [content]);
  const publishMode = vault?.is_paid ? `${formatAmount(vault.price_monthly)} ShelbyUSD / month` : "Free storefront";

  if (!isConnected) {
    return (
      <main className="vault-page min-h-screen">
        <VaultTopbar />
        <section className="container-shell py-16">
          <div className="vault-empty max-w-3xl p-8">
            <BackLink href="/" label="Back to marketplace" className="mb-8" />
            <Radio className="h-8 w-8 text-brand" />
            <h1 className="mt-12 max-w-2xl font-display text-7xl leading-none">Connect Petra to open the creator workspace.</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-text-tertiary">The marketplace stays public. The vault is where the wallet owner publishes files, prices access, and watches subscriber activity.</p>
            <div className="relative z-10 mt-7"><WalletButton /></div>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="vault-page min-h-screen">
        <VaultTopbar address={address} />
        <section className="container-shell py-10"><BackLink href="/" label="Back to marketplace" className="mb-8" /><p className="font-mono text-sm text-text-tertiary">Loading creator workspace</p></section>
      </main>
    );
  }

  if (!vault) return <VaultForm onSaved={load} />;

  function copyStorefront() {
    const url = `${window.location.origin}/creator/${vault.wallet_address}`;
    void navigator.clipboard.writeText(url);
    setCopied("storefront");
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <main className="vault-page min-h-screen">
      <VaultTopbar address={address} />
      <section className="container-shell py-8">
        <BackLink href="/" label="Back to marketplace" className="mb-8" />
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <header className="vault-panel p-6">
            <div className="mb-5 h-32 overflow-hidden border border-base bg-[color:var(--vault-panel-strong)]">
              <ShelbyBlobImage
                walletAddress={vault.wallet_address}
                blobId={vault.cover_blob_id}
                alt=""
                className="h-full w-full object-cover"
                fallback={<div className="h-full bg-[linear-gradient(rgba(102,76,35,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(102,76,35,0.12)_1px,transparent_1px)] bg-[length:28px_28px]" />}
              />
            </div>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
              <div className="flex gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-base bg-[color:var(--vault-bg)] font-display text-5xl leading-none">
                  <ShelbyBlobImage
                    walletAddress={vault.wallet_address}
                    blobId={vault.avatar_blob_id}
                    alt=""
                    className="h-full w-full object-cover"
                    fallback={(vault.display_name || "V").slice(0, 1)}
                  />
                </div>
                <div>
                <p className="font-mono text-xs text-brand">CREATOR WORKSPACE</p>
                <h1 className="mt-4 max-w-3xl font-display text-7xl leading-none text-text-primary">{vault.display_name}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-text-tertiary">{vault.bio || "Add a sharper bio in settings so the storefront reads like a finished publication."}</p>
                </div>
              </div>
              <div className="min-w-[220px] border border-base p-4 font-mono text-xs text-text-tertiary">
                <p className="text-text-primary">{publishMode}</p>
                <p className="mt-2">{vault.category || "Other"}</p>
                <p className="mt-2">{truncateMiddle(vault.wallet_address, 10, 8)}</p>
              </div>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/vault/upload" className="interactive-control vault-command p-5">
              <Upload className="h-5 w-5 text-brand" />
              <p className="mt-8 font-display text-3xl leading-none">Publish file</p>
              <p className="mt-2 text-xs leading-5 text-text-tertiary">Register on Shelby and add it to the storefront feed.</p>
            </Link>
            <Link href="/vault/settings" className="interactive-control vault-command p-5">
              <Settings className="h-5 w-5 text-brand" />
              <p className="mt-8 font-display text-3xl leading-none">Edit profile</p>
              <p className="mt-2 text-xs leading-5 text-text-tertiary">Identity, category, cover art, access mode, price.</p>
            </Link>
            <button type="button" onClick={copyStorefront} className="interactive-control vault-command p-5 text-left">
              {copied === "storefront" ? <Copy className="h-5 w-5 text-brand" /> : <Share2 className="h-5 w-5 text-brand" />}
              <p className="mt-8 font-display text-3xl leading-none">Share storefront</p>
              <p className="mt-2 text-xs leading-5 text-text-tertiary">{copied === "storefront" ? "Storefront URL copied." : "Copy the public creator URL for posts and profiles."}</p>
            </button>
            <Link href="/vault/analytics" className="interactive-control vault-command p-5">
              <LineChart className="h-5 w-5 text-brand" />
              <p className="mt-8 font-display text-3xl leading-none">Read signals</p>
              <p className="mt-2 text-xs leading-5 text-text-tertiary">Views, earnings, subscriptions, and supporter activity.</p>
            </Link>
          </div>
        </div>

        <section className="vault-scoreboard mt-6">
          <div>
            <p className="font-mono text-xs text-text-tertiary">TOTAL EARNINGS</p>
            <p className="mt-3 font-display text-6xl leading-none text-text-primary">{formatAmount(stats.earnings)}</p>
            <p className="mt-2 font-mono text-xs text-brand">ShelbyUSD paid directly to wallet</p>
          </div>
          <div>
            <Users className="h-5 w-5 text-brand" />
            <p className="mt-8 font-display text-5xl leading-none">{stats.subscribers}</p>
            <p className="mt-2 font-mono text-xs text-text-tertiary">subscribers</p>
          </div>
          <div>
            <FileText className="h-5 w-5 text-brand" />
            <p className="mt-8 font-display text-5xl leading-none">{stats.contentItems}</p>
            <p className="mt-2 font-mono text-xs text-text-tertiary">{previewCount} public previews</p>
          </div>
          <div>
            <Radio className="h-5 w-5 text-brand" />
            <p className="mt-8 font-display text-5xl leading-none">{stats.views}</p>
            <p className="mt-2 font-mono text-xs text-text-tertiary">content views</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="vault-panel p-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl leading-none">Publishing queue</h2>
                <p className="mt-2 text-sm text-text-tertiary">Recent uploads, visibility state, and file activity.</p>
              </div>
              <Link href="/vault/upload" className="interactive-control inline-flex min-h-10 items-center gap-2 bg-brand px-3 font-mono text-xs text-brand-dark">
                <Plus className="h-3.5 w-3.5" />
                New upload
              </Link>
            </div>
            <div className="grid gap-3">
              {latestContent.length === 0 ? (
                <EmptyState title="Publish the first object in your vault." body="Upload a preview, essay, audio file, deck, dataset, or video. It will appear here as a creator-owned Shelby file with view activity." action="Upload content" href="/vault/upload" icon={Upload} />
              ) : latestContent.map((item) => (
                <div key={item.id} className="vault-file-row grid gap-4 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                  <FileKind fileType={item.file_type} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setViewerItem(item)} className="interactive-control min-w-0 max-w-full text-left">
                        <span className="block truncate font-display text-3xl leading-none text-text-primary">{item.title}</span>
                      </button>
                      <span className="border border-base px-2 py-1 font-mono text-[10px] text-text-tertiary">{item.is_preview ? "PREVIEW" : "LOCKED"}</span>
                      <span className="border border-base px-2 py-1 font-mono text-[10px] text-text-tertiary">{item.allow_download ? "DOWNLOAD" : "STREAM"}</span>
                    </div>
                    <p className="mt-2 max-w-full truncate font-mono text-xs text-text-tertiary" title={item.file_name || item.file_type || "file"}>
                      {item.view_count ?? 0} views / {formatDate(item.created_at)} / {item.file_name || item.file_type || "file"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setViewerItem(item)} className="interactive-control inline-flex h-10 items-center justify-center border border-base px-3 font-mono text-xs text-text-tertiary hover:text-text-primary">
                      Open
                    </button>
                    <button type="button" onClick={() => setSettingsItem(item)} className="interactive-control inline-flex h-10 w-10 items-center justify-center border border-base text-text-tertiary hover:text-text-primary" aria-label="File settings">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeContent(item.id)} className="interactive-control inline-flex h-10 w-10 items-center justify-center border border-base text-text-tertiary hover:text-text-primary" aria-label="Delete content">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="grid gap-6">
            <section className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Supporter feed</h2>
              <div className="mt-5 grid gap-3">
                {donations.length === 0 ? (
                  <div className="vault-empty min-h-[260px] p-5">
                    <Gift className="h-6 w-6 text-brand" />
                    <p className="mt-12 max-w-xs font-display text-3xl leading-none">No supporter notes yet.</p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-text-tertiary">Free storefront donations and paid supporter messages will collect here once the public page is active.</p>
                  </div>
                ) : donations.map((donation) => (
                  <div key={donation.id} className="vault-activity-row p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-text-secondary">{truncateMiddle(donation.donor_wallet)}</p>
                      <p className="font-mono text-xs text-brand">{formatAmount(donation.amount)} ShelbyUSD</p>
                    </div>
                    {donation.message ? <p className="mt-2 text-sm text-text-tertiary">{donation.message}</p> : null}
                    <p className="mt-2 font-mono text-[10px] text-text-tertiary">{formatDate(donation.created_at)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Storefront checklist</h2>
              <div className="mt-5 grid gap-2 font-mono text-xs text-text-tertiary">
                {[
                  ["Profile named", Boolean(vault.display_name)],
                  ["Bio written", Boolean(vault.bio)],
                  ["Preview uploaded", previewCount > 0],
                  ["Pricing decided", vault.is_paid ? Number(vault.price_monthly) > 0 : true]
                ].map(([label, done]) => (
                  <div key={String(label)} className="flex items-center justify-between border border-base px-3 py-2">
                    <span>{label}</span>
                    <span className={done ? "text-brand" : "text-text-tertiary"}>{done ? "ready" : "open"}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
      {viewerItem ? <VaultContentViewer item={viewerItem} onClose={() => setViewerItem(null)} /> : null}
      {settingsItem ? <ContentSettingsModal item={settingsItem} onClose={() => setSettingsItem(null)} onSaved={load} /> : null}
    </main>
  );
}
