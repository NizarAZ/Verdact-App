"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Copy, ExternalLink, FileAudio, FileImage, FileText, FileVideo, Gift, LineChart, Plus, Radio, Settings, Share2, Trash2, Upload, Users } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { NetworkBadge } from "@/components/shared/NetworkBadge";
import { WalletAddress } from "@/components/shared/WalletAddress";
import { BackLink } from "@/components/ui/BackLink";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { acceptedUploadInput, acceptedUploadTypes, categories, maxUploadBytes } from "@/lib/constants";
import { waitForShelbynetTransaction } from "@/lib/client-chain";
import { formatAmount, formatDate, truncateMiddle } from "@/lib/format";
import { getShelbyBlobUrl } from "@/lib/shelby-explorer";
import { createBlobObjectUrl, createClientBlobRegistration, putShelbyBlobWithRetry, readShelbyBlob, waitForShelbyBlobMetadata } from "@/lib/shelby-browser";

type VaultPayload = {
  vault: any | null;
  content?: Array<any>;
  donations?: Array<any>;
  supporterActivity?: Array<any>;
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
          <Link href="/" prefetch={false} className="interactive-control hidden hover:text-text-primary sm:inline">Marketplace</Link>
          <Link href="/vault/upload" className="interactive-control hidden hover:text-text-primary sm:inline">Upload</Link>
          <Link href="/vault/analytics" className="interactive-control hidden hover:text-text-primary sm:inline">Analytics</Link>
          <NetworkBadge />
          {address ? <WalletAddress address={address} start={8} end={6} className="border border-base px-3 py-2" /> : <WalletButton compact />}
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
  const Icon = fileType?.startsWith("video/")
    ? FileVideo
    : fileType?.startsWith("audio/")
      ? FileAudio
      : fileType?.startsWith("image/")
        ? FileImage
        : FileText;
  const label = fileType?.split("/")[0]?.toUpperCase() || "FILE";
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center border border-base bg-[color:var(--vault-bg)] font-mono text-[9px] text-brand">
      <Icon className="mb-1 h-4 w-4" />
      {label.slice(0, 5)}
    </div>
  );
}

function cleanBlobFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "banner";
}

function shortContentBannerBlobName(address: string, fileName: string) {
  const extension = (fileName.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? "").toLowerCase();
  const walletPart = address.replace(/^0x/, "").slice(-8);
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
  return cleanBlobFileName(`t-${walletPart}-${randomPart}${extension}`).slice(0, 48);
}

function shortContentBlobName(address: string, fileName: string) {
  const extension = (fileName.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? "").toLowerCase();
  const walletPart = address.replace(/^0x/, "").slice(-8);
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
  return cleanBlobFileName(`c-${walletPart}-${randomPart}${extension}`).slice(0, 48);
}

async function fileBytes(file: File) {
  return new Uint8Array(await file.arrayBuffer());
}

function compactFileName(name?: string | null, max = 64) {
  if (!name) return "Shelby file";
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot) : "";
  const base = dot > 0 ? name.slice(0, dot) : name;
  const room = Math.max(18, max - extension.length - 3);
  return `${base.slice(0, room)}...${extension}`;
}

function isEditableTextContent(item: any) {
  const type = String(item.file_type || "");
  const name = String(item.file_name || "");
  return type.startsWith("text/") || type === "application/json" || name.endsWith(".md") || name.endsWith(".txt");
}

function fileSizeLabel(size?: number) {
  if (!size) return "";
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
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
          {error ? (
            <div className="max-w-md border border-base bg-[color:var(--vault-panel)] p-5 text-center">
              <AlertTriangle className="mx-auto h-7 w-7 text-brand" />
              <p className="mt-5 font-display text-3xl leading-none text-text-primary">Shelby blob unavailable.</p>
              <p className="mt-3 text-sm leading-6 text-text-tertiary">
                This listing exists in Verdact metadata, but the stored Shelby blob could not be downloaded. Older uploads may have expired or used a retired blob name format.
              </p>
              <p className="mt-4 font-mono text-xs text-brand">{error}</p>
            </div>
          ) : !url ? <p className="font-mono text-sm text-text-tertiary">Loading from Shelby</p> : null}
          {url && item.file_type?.startsWith("video/") ? <video src={url} controls className="max-h-full w-full" /> : null}
          {url && item.file_type?.startsWith("image/") ? <img src={url} alt={item.title} className="max-h-full max-w-full" /> : null}
          {url && item.file_type === "application/pdf" ? <iframe src={url} title={item.title} className="h-full min-h-[70vh] w-full" /> : null}
          {url && text ? <pre className="w-full whitespace-pre-wrap font-mono text-sm leading-6 text-text-primary">{text}</pre> : null}
          {url && !text && !item.file_type?.startsWith("video/") && !item.file_type?.startsWith("image/") && item.file_type !== "application/pdf" ? (
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
  const { address, signAndSubmitTransaction, walletFetch } = useWallet();
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(item.description || "");
  const [thumbnailBlobId, setThumbnailBlobId] = useState(item.thumbnail_blob_id || "");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [allowDownload, setAllowDownload] = useState(item.allow_download !== false);
  const [visibility, setVisibility] = useState<"preview" | "locked" | "free">(item.is_locked ? "locked" : item.is_preview ? "preview" : "free");
  const [tags, setTags] = useState(Array.isArray(item.tags) ? item.tags.join(", ") : "");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [textBody, setTextBody] = useState("");
  const [initialTextBody, setInitialTextBody] = useState("");
  const [loadingTextBody, setLoadingTextBody] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const textEditable = isEditableTextContent(item);

  useEffect(() => {
    let active = true;
    if (!textEditable || !item.blob_id) return;

    async function loadTextBody() {
      setLoadingTextBody(true);
      try {
        const bytes = await readShelbyBlob({ walletAddress: item.wallet_address, blobName: item.blob_id });
        if (!active) return;
        const value = new TextDecoder().decode(bytes);
        setTextBody(value);
        setInitialTextBody(value);
      } catch {
        if (active) setStatus("Current text blob could not be loaded. You can still write a replacement.");
      } finally {
        if (active) setLoadingTextBody(false);
      }
    }

    void loadTextBody();
    return () => {
      active = false;
    };
  }, [item.blob_id, item.wallet_address, textEditable]);

  async function uploadThumbnail(file?: File | null) {
    if (!file || !address) return;
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setUploadingThumbnail(true);
    setStatus("Uploading content banner to Shelby.");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blobName = shortContentBannerBlobName(address, file.name);
      const expirationMicros = Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000;
      const payload = await createClientBlobRegistration({
        walletAddress: address,
        blobName,
        blobData: bytes,
        expirationMicros
      });
      const tx = await signAndSubmitTransaction(payload);
      await waitForShelbynetTransaction(tx.hash);
      await waitForShelbyBlobMetadata({ walletAddress: address, blobName });
      await putShelbyBlobWithRetry({
        walletAddress: address,
        blobName,
        blobData: bytes,
        file,
        walletFetch,
        onStatus: setStatus
      });
      setThumbnailBlobId(blobName);
      setStatus("Content banner uploaded. Save file settings to apply it.");
    } catch (error) {
      setThumbnailPreview("");
      URL.revokeObjectURL(previewUrl);
      setStatus(error instanceof Error ? error.message : "Failed to upload content banner.");
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function uploadReplacementBlob(blobFile: File) {
    if (!address) throw new Error("Connect Petra before replacing content.");
    if (blobFile.size > maxUploadBytes) throw new Error("Files are limited to 100MB.");
    const typeAllowed = acceptedUploadTypes.includes(blobFile.type) || blobFile.name.endsWith(".md");
    if (!typeAllowed) throw new Error("Unsupported file type.");

    const bytes = await fileBytes(blobFile);
    const blobName = shortContentBlobName(address, blobFile.name);
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000;

    setStatus("Registering replacement content on Shelbynet.");
    const payload = await createClientBlobRegistration({
      walletAddress: address,
      blobName,
      blobData: bytes,
      expirationMicros
    });
    const tx = await signAndSubmitTransaction(payload);
    await waitForShelbynetTransaction(tx.hash);
    await waitForShelbyBlobMetadata({ walletAddress: address, blobName });

    await putShelbyBlobWithRetry({
      walletAddress: address,
      blobName,
      blobData: bytes,
      file: blobFile,
      walletFetch,
      onStatus: setStatus
    });

    return { blobName, txHash: tx.hash, sizeBytes: blobFile.size };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      let replacement: {
        blob_id: string;
        onchain_tx_hash: string;
        file_type: string;
        file_name: string;
        size_bytes: number;
      } | null = null;

      if (replacementFile) {
        const upload = await uploadReplacementBlob(replacementFile);
        replacement = {
          blob_id: upload.blobName,
          onchain_tx_hash: upload.txHash,
          file_type: replacementFile.type || "application/octet-stream",
          file_name: replacementFile.name,
          size_bytes: upload.sizeBytes
        };
      } else if (textEditable && textBody !== initialTextBody) {
        const fileName = item.file_name?.endsWith(".md") || item.file_type === "text/markdown"
          ? `${cleanBlobFileName(title || item.title || "post")}.md`
          : (item.file_name || `${cleanBlobFileName(title || item.title || "post")}.txt`);
        const textFile = new File([textBody], fileName, { type: item.file_type || "text/plain" });
        const upload = await uploadReplacementBlob(textFile);
        replacement = {
          blob_id: upload.blobName,
          onchain_tx_hash: upload.txHash,
          file_type: textFile.type || "text/plain",
          file_name: textFile.name,
          size_bytes: upload.sizeBytes
        };
      }

      const response = await walletFetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          thumbnail_blob_id: thumbnailBlobId,
          allow_download: allowDownload,
          visibility,
          is_preview: visibility === "preview" || visibility === "free",
          is_locked: visibility === "locked",
          tags: tags.split(",").map((tag: string) => tag.trim()).filter(Boolean),
          ...(replacement ?? {})
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
      <form onSubmit={save} className="mx-auto max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto border border-base bg-[color:var(--color-bg)] p-5">
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
            Content banner
            <div className="mt-2 overflow-hidden border border-base bg-[color:var(--vault-bg)]">
              <div className="relative flex h-44 items-center justify-center">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : thumbnailBlobId ? (
                  <ShelbyBlobImage
                    walletAddress={item.wallet_address}
                    blobId={thumbnailBlobId}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    fallback={<FileText className="h-6 w-6 text-brand" />}
                  />
                ) : (
                  <FileText className="h-6 w-6 text-brand" />
                )}
              </div>
              <div className="border-t border-base p-3">
                <label className="interactive-control inline-flex min-h-10 w-full cursor-pointer items-center justify-center border border-base px-3 font-mono text-xs">
                  {uploadingThumbnail ? "Uploading banner" : thumbnailBlobId ? "Replace banner from files" : "Upload banner from files"}
                  <input type="file" accept="image/*" disabled={uploadingThumbnail} onChange={(event) => uploadThumbnail(event.target.files?.[0])} className="sr-only" />
                </label>
              </div>
            </div>
          </label>
          <div className="border border-base p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div className="min-w-0">
                <p className="text-sm text-text-secondary">Content file</p>
                <p className="mt-2 truncate font-mono text-xs text-text-tertiary" title={item.file_name || item.blob_id}>
                  Current: {compactFileName(item.file_name || item.blob_id, 72)}
                </p>
                {replacementFile ? (
                  <p className="mt-1 truncate font-mono text-xs text-brand" title={replacementFile.name}>
                    Replacement: {compactFileName(replacementFile.name, 72)} {fileSizeLabel(replacementFile.size)}
                  </p>
                ) : null}
              </div>
              <label className="interactive-control inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center border border-base px-3 font-mono text-xs">
                Replace local file
                <input type="file" accept={acceptedUploadInput} onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)} className="sr-only" />
              </label>
            </div>
            {textEditable ? (
              <label className="mt-4 block text-sm text-text-secondary">
                Edit text body
                <textarea
                  value={textBody}
                  disabled={loadingTextBody || Boolean(replacementFile)}
                  onChange={(event) => setTextBody(event.target.value)}
                  placeholder={loadingTextBody ? "Loading current Shelby text" : "Write a replacement text body."}
                  className="mt-2 min-h-44 w-full border border-base bg-transparent px-3 py-3 font-mono text-sm leading-6 text-text-primary outline-none focus:border-brand disabled:opacity-50"
                />
                <span className="mt-2 block font-mono text-[10px] text-text-tertiary">
                  {replacementFile ? "The selected local file will replace this text edit." : "Saving changed text publishes a new Shelby blob and points this post to it."}
                </span>
              </label>
            ) : (
              <p className="mt-4 text-sm leading-6 text-text-tertiary">
                This upload is binary media. Replace it with another local file to update the storefront item.
              </p>
            )}
          </div>
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
          <label className="block text-sm text-text-secondary">
            Visibility
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "preview" | "locked" | "free")} className="mt-2 w-full border border-base bg-transparent px-3 py-3 font-mono text-xs text-text-primary outline-none focus:border-brand">
              <option value="preview">Public Preview</option>
              <option value="locked">Locked (subscribers only)</option>
              <option value="free">Free/Public</option>
            </select>
          </label>
          <label className="block text-sm text-text-secondary">
            Tags
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="art, research, pdf" className="mt-2 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
          </label>
        </div>

        <button type="submit" disabled={busy || uploadingThumbnail} className="interactive-control mt-5 min-h-12 w-full bg-brand px-4 font-mono text-sm text-brand-dark disabled:opacity-50">
          {uploadingThumbnail ? "Waiting for banner upload" : busy ? "Saving" : "Save file settings"}
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
  const [contentStatus, setContentStatus] = useState("");

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

  async function removeContent(item: any) {
    setContentStatus("");
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    const response = await walletFetch(`/api/content/${item.id}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setContentStatus(json.error || "Failed to delete content listing.");
      return;
    }
    setContentStatus("Content listing removed.");
    await load();
  }

  const stats = payload?.stats ?? { subscribers: 0, earnings: 0, contentItems: 0, views: 0 };
  const content = payload?.content ?? [];
  const donations = payload?.donations ?? [];
  const supporterActivity = payload?.supporterActivity ?? [];
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
    const shareText = `Check out ${vault.display_name} on Verdact - ${(vault.bio || "").slice(0, 80)}${vault.bio && vault.bio.length > 80 ? "..." : ""}
${vault.is_paid ? `Subscribe from ${formatAmount(vault.price_monthly)} ShelbyUSD/month` : "Support with ShelbyUSD"}: ${url}`;
    void navigator.clipboard.writeText(shareText);
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

        {Boolean(vault.display_name) && Boolean(vault.bio && vault.bio.length > 20) && previewCount > 0 && (vault.is_paid ? Number(vault.price_monthly) > 0 : true) && content.length > 0 ? (
          <div className="storefront-live-banner mt-6 border border-base bg-[color:var(--vault-panel)] p-4 font-mono text-sm text-text-secondary">
            <span className="text-brand">Your storefront is live.</span>{" "}
            <a href={`/creator/${vault.wallet_address}`} target="_blank" rel="noreferrer" className="interactive-control text-brand">View it</a>
          </div>
        ) : null}

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
            {contentStatus ? <p className="mb-4 border border-base p-3 font-mono text-xs text-text-secondary">{contentStatus}</p> : null}
            <div className="grid gap-4">
              {latestContent.length === 0 ? (
                <EmptyState title="Publish the first object in your vault." body="Upload a preview, essay, deck, dataset, image, PDF, text file, or video. It will appear here as a creator-owned Shelby file with view activity." action="Upload content" href="/vault/upload" icon={Upload} />
              ) : latestContent.map((item) => (
                <article key={item.id} className="market-card grid min-w-0 overflow-hidden md:grid-cols-[0.48fr_1fr]">
                  <div className="relative min-h-56 border-b border-[color:var(--market-border)] bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:28px_28px] md:border-b-0 md:border-r">
                    {item.thumbnail_blob_id ? (
                      <ShelbyBlobImage
                        walletAddress={item.wallet_address}
                        blobId={item.thumbnail_blob_id}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        fallback={
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                            <FileKind fileType={item.file_type} />
                            <p className="px-4 font-mono text-[10px] leading-5 text-text-tertiary">Banner saved. Waiting for Shelby image.</p>
                          </div>
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileKind fileType={item.file_type} />
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-56 min-w-0 flex-col p-5">
                    <div className="flex flex-wrap gap-2 font-mono text-[10px] text-text-tertiary">
                      <span className="border border-base px-2 py-1">{item.file_type || "file"}</span>
                      <span className="border border-base px-2 py-1">{formatDate(item.created_at)}</span>
                      <span className="border border-base px-2 py-1 text-brand">{item.is_preview ? "PREVIEW" : "LOCKED"}</span>
                      <span className="border border-base px-2 py-1">{item.allow_download ? "DOWNLOAD" : "STREAM"}</span>
                    </div>
                    <button type="button" onClick={() => setViewerItem(item)} className="interactive-control mt-7 min-w-0 text-left">
                      <span className="block truncate font-display text-5xl leading-none text-text-primary" title={item.title}>{item.title}</span>
                    </button>
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-text-tertiary">{item.description || "No description added yet."}</p>
                    <p className="mt-3 max-w-full overflow-hidden truncate font-mono text-xs text-text-tertiary" title={item.file_name || item.file_type || "file"}>
                      {item.view_count ?? 0} views / {item.file_name || item.file_type || "file"}
                    </p>
                    {item.blob_id ? (
                      <a href={getShelbyBlobUrl(item.wallet_address, item.blob_id)} target="_blank" rel="noreferrer" className="interactive-control mt-3 inline-flex items-center gap-2 font-mono text-xs text-brand">
                        Blob ID: {truncateMiddle(item.blob_id, 10, 8)} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {item.thumbnail_blob_id ? (
                      <a href={getShelbyBlobUrl(item.wallet_address, item.thumbnail_blob_id)} target="_blank" rel="noreferrer" className="interactive-control mt-2 inline-flex items-center gap-2 font-mono text-xs text-text-tertiary">
                        Banner ID: {truncateMiddle(item.thumbnail_blob_id, 10, 8)} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    <div className="mt-auto flex flex-wrap gap-2 pt-8">
                      <button type="button" onClick={() => setViewerItem(item)} className="interactive-control inline-flex min-h-10 flex-1 items-center justify-center border border-base px-3 font-mono text-xs text-text-tertiary hover:text-text-primary">
                        Open
                      </button>
                      <button type="button" onClick={() => setSettingsItem(item)} className="interactive-control inline-flex h-10 w-10 items-center justify-center border border-base text-text-tertiary hover:text-text-primary" aria-label="File settings">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeContent(item)} className="interactive-control inline-flex h-10 w-10 items-center justify-center border border-base text-text-tertiary hover:text-text-primary" aria-label="Delete content">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid gap-6">
            <section className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Supporter feed</h2>
              <div className="mt-5 grid gap-3">
                {supporterActivity.length === 0 ? (
                  <div className="vault-empty min-h-[260px] p-5">
                    <Gift className="h-6 w-6 text-brand" />
                    <p className="mt-12 max-w-xs font-display text-3xl leading-none">No supporter notes yet.</p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-text-tertiary">Free storefront donations and paid supporter messages will collect here once the public page is active.</p>
                  </div>
                ) : supporterActivity.map((event) => (
                  <div key={`${event.kind}-${event.id}`} className="vault-activity-row p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-text-secondary">{truncateMiddle(event.kind === "subscription" ? event.subscriber_wallet : event.donor_wallet)}</p>
                      <p className="font-mono text-xs text-brand">{formatAmount(event.kind === "subscription" ? event.amount_paid : event.amount)} ShelbyUSD</p>
                    </div>
                    {event.kind === "donation" && event.message ? <blockquote className="mt-2 border-l-2 border-base pl-3 text-sm text-text-tertiary">"{event.message}"</blockquote> : null}
                    <p className="mt-2 font-mono text-[10px] text-text-tertiary">{event.kind === "subscription" ? "subscription" : "donation"} / {formatDate(event.at)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Storefront checklist</h2>
              <div className="mt-5 grid gap-2 font-mono text-xs text-text-tertiary">
                {[
                  ["Profile named", Boolean(vault.display_name), "Add a display name in settings."],
                  ["Bio written", Boolean(vault.bio && vault.bio.length > 20), "Write at least a short storefront bio in settings."],
                  ["Preview uploaded", previewCount > 0, "Upload a file and set it to Public Preview."],
                  ["Pricing decided", vault.is_paid ? Number(vault.price_monthly) > 0 : true, "Set a monthly price or switch to a free storefront."],
                  ["First file uploaded", content.length > 0, "Publish your first Shelby-backed file."]
                ].map(([label, done, hint]) => (
                  <div key={String(label)} className="border border-base px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      <span className={done ? "text-brand" : "text-text-tertiary"}>{done ? "ready" : "open"}</span>
                    </div>
                    {!done ? <p className="mt-2 text-[11px] leading-5 text-text-tertiary">{hint} {label === "Preview uploaded" || label === "First file uploaded" ? <Link href="/vault/upload" className="text-brand">Upload now</Link> : <Link href="/vault/settings" className="text-brand">Open settings</Link>}</p> : null}
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
