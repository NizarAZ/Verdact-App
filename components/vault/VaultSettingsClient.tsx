"use client";

import { useEffect, useState } from "react";
import { Camera, Check, Image as ImageIcon, Radio, Wallet } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { BackLink } from "@/components/ui/BackLink";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { categories } from "@/lib/constants";
import { waitForShelbynetTransaction } from "@/lib/client-chain";
import { createClientBlobRegistration, putShelbyBlob, putShelbyBlobViaServer } from "@/lib/shelby-browser";
import { truncateMiddle } from "@/lib/format";

function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "asset";
}

function shortAssetBlobName(address: string, field: "avatar_blob_id" | "cover_blob_id", fileName: string) {
  const prefix = field === "avatar_blob_id" ? "a" : "b";
  const extension = (fileName.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? "").toLowerCase();
  const walletPart = address.replace(/^0x/, "").slice(-8);
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
  return cleanName(`${prefix}-${walletPart}-${randomPart}${extension}`).slice(0, 48);
}

export function VaultSettingsClient() {
  const { address, isConnected, signAndSubmitTransaction, walletFetch } = useWallet();
  const [form, setForm] = useState<any | null>(null);
  const [status, setStatus] = useState("");
  const [assetPreview, setAssetPreview] = useState<{ avatar_blob_id?: string; cover_blob_id?: string }>({});
  const [assetUploads, setAssetUploads] = useState<{ avatar_blob_id: boolean; cover_blob_id: boolean }>({
    avatar_blob_id: false,
    cover_blob_id: false
  });

  useEffect(() => {
    if (!isConnected) return;
    walletFetch("/api/vault/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => setForm(json.vault))
      .catch(() => setStatus("Failed to load settings."));
  }, [isConnected, walletFetch]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (assetUploads.avatar_blob_id || assetUploads.cover_blob_id) {
      setStatus("Wait for image uploads to finish before saving.");
      return;
    }
    setStatus("");
    const response = await walletFetch("/api/vault/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const json = await response.json();
    if (!response.ok) setStatus(json.error || "Failed to save settings.");
    else {
      setForm(json.vault);
      setAssetPreview({});
      setStatus("Settings saved.");
    }
  }

  async function uploadAsset(field: "avatar_blob_id" | "cover_blob_id", file?: File | null) {
    if (!file || !address) return;
    setStatus(field === "avatar_blob_id" ? "Uploading avatar to Shelby." : "Uploading cover to Shelby.");
    setAssetUploads((current) => ({ ...current, [field]: true }));
    const previewUrl = URL.createObjectURL(file);
    setAssetPreview((current) => ({ ...current, [field]: previewUrl }));
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blobName = shortAssetBlobName(address, field, file.name);
      const expirationMicros = Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000;
      const payload = await createClientBlobRegistration({
        walletAddress: address,
        blobName,
        blobData: bytes,
        expirationMicros
      });
      const tx = await signAndSubmitTransaction(payload);
      await waitForShelbynetTransaction(tx.hash);
      try {
        await putShelbyBlob({ walletAddress: address, blobName, blobData: bytes });
      } catch {
        await putShelbyBlobViaServer({ blobName, file, walletFetch });
      }
      setForm((current: any) => ({ ...current, [field]: blobName }));
      setStatus(`${field === "avatar_blob_id" ? "Avatar" : "Cover"} uploaded. Save settings to publish it.`);
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      setAssetPreview((current) => ({ ...current, [field]: undefined }));
      setStatus(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setAssetUploads((current) => ({ ...current, [field]: false }));
    }
  }

  if (!isConnected) {
    return (
      <main className="vault-page min-h-screen">
        <section className="container-shell py-8">
          <BackLink href="/vault" label="Back to vault" className="mb-8" />
          <div className="vault-empty p-8">
            <h1 className="font-display text-6xl leading-none">Connect Petra to edit the vault.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-text-tertiary">Settings are wallet-owned and update the public storefront metadata.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!form) return <main className="vault-page min-h-screen"><section className="container-shell py-8"><BackLink href="/vault" label="Back to vault" className="mb-8" /><p className="font-mono text-sm text-text-tertiary">Loading settings</p></section></main>;

  return (
    <main className="vault-page min-h-screen">
      <section className="container-shell py-8">
        <BackLink href="/vault" label="Back to vault" className="mb-8" />

        <form onSubmit={save} className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="vault-panel h-fit p-6 lg:sticky lg:top-24">
            <p className="font-mono text-xs text-brand">STOREFRONT IDENTITY</p>
            <div className="mt-8 border border-base bg-[color:var(--vault-bg)] p-5">
              <div className="mb-4 h-28 overflow-hidden border border-base bg-[color:var(--vault-panel-strong)]">
                {assetPreview.cover_blob_id ? (
                  <img src={assetPreview.cover_blob_id} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ShelbyBlobImage
                    walletAddress={address}
                    blobId={form.cover_blob_id}
                    alt=""
                    className="h-full w-full object-cover"
                    fallback={<div className="h-full bg-[linear-gradient(rgba(102,76,35,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(102,76,35,0.12)_1px,transparent_1px)] bg-[length:24px_24px]" />}
                  />
                )}
              </div>
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden border border-base font-display text-6xl leading-none">
                {assetPreview.avatar_blob_id ? (
                  <img src={assetPreview.avatar_blob_id} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ShelbyBlobImage
                    walletAddress={address}
                    blobId={form.avatar_blob_id}
                    alt=""
                    className="h-full w-full object-cover"
                    fallback={(form.display_name || "V").slice(0, 1)}
                  />
                )}
              </div>
              <h1 className="mt-6 font-display text-6xl leading-none">{form.display_name || "Untitled creator"}</h1>
              <p className="mt-3 font-mono text-xs text-text-tertiary">{truncateMiddle(address, 12, 8)}</p>
              <p className="mt-5 text-sm leading-6 text-text-tertiary">{form.bio || "Write the public description supporters will see first."}</p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] text-text-tertiary">
                <span className="border border-base px-2 py-1">{form.category || "Other"}</span>
                <span className="border border-base px-2 py-1">{form.is_paid ? `${form.price_monthly || 0} / month` : "FREE"}</span>
              </div>
            </div>
            {status ? <p className="mt-5 border border-base p-3 font-mono text-xs text-text-secondary">{status}</p> : null}
          </aside>

          <section className="grid gap-6">
            <div className="vault-panel p-6">
              <h2 className="font-display text-5xl leading-none">Profile</h2>
              <div className="mt-6 grid gap-4">
                <label className="block text-sm text-text-secondary">
                  Display name
                  <input value={form.display_name ?? ""} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className="mt-2 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
                </label>
                <label className="block text-sm text-text-secondary">
                  Bio
                  <textarea value={form.bio ?? ""} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="mt-2 min-h-32 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
                </label>
                <StyledSelect label="Category" value={form.category ?? "Other"} options={categories} onChange={(category) => setForm({ ...form, category })} />
              </div>
            </div>

            <div className="vault-panel p-6">
              <h2 className="font-display text-5xl leading-none">Visual assets</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="interactive-control vault-fieldset block cursor-pointer p-5">
                  <div className="flex h-28 items-center justify-center overflow-hidden border border-base bg-[color:var(--vault-bg)]">
                    {assetPreview.avatar_blob_id ? (
                      <img src={assetPreview.avatar_blob_id} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-5 w-5 text-brand" />
                    )}
                  </div>
                  <p className="mt-5 font-display text-3xl leading-none">Avatar</p>
                  <p className="mt-2 text-xs leading-5 text-text-tertiary">
                    {assetUploads.avatar_blob_id ? "Uploading and confirming on Shelby." : "Stored as a Shelby blob and used on marketplace cards."}
                  </p>
                  <input type="file" accept="image/*" disabled={assetUploads.avatar_blob_id} onChange={(event) => uploadAsset("avatar_blob_id", event.target.files?.[0])} className="sr-only" />
                </label>
                <label className="interactive-control vault-fieldset block cursor-pointer p-5">
                  <div className="flex h-28 items-center justify-center overflow-hidden border border-base bg-[color:var(--vault-bg)]">
                    {assetPreview.cover_blob_id ? (
                      <img src={assetPreview.cover_blob_id} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-brand" />
                    )}
                  </div>
                  <p className="mt-5 font-display text-3xl leading-none">Cover</p>
                  <p className="mt-2 text-xs leading-5 text-text-tertiary">
                    {assetUploads.cover_blob_id ? "Uploading and confirming on Shelby." : "Creates a more finished public storefront header."}
                  </p>
                  <input type="file" accept="image/*" disabled={assetUploads.cover_blob_id} onChange={(event) => uploadAsset("cover_blob_id", event.target.files?.[0])} className="sr-only" />
                </label>
              </div>
              <div className="mt-4 grid gap-4">
                <input value={form.avatar_blob_id ?? ""} onChange={(event) => setForm({ ...form, avatar_blob_id: event.target.value })} placeholder="Avatar Shelby blob id" className="w-full border border-base bg-transparent px-3 py-3 font-mono text-xs text-text-primary outline-none focus:border-brand" />
                <input value={form.cover_blob_id ?? ""} onChange={(event) => setForm({ ...form, cover_blob_id: event.target.value })} placeholder="Cover Shelby blob id" className="w-full border border-base bg-transparent px-3 py-3 font-mono text-xs text-text-primary outline-none focus:border-brand" />
              </div>
            </div>

            <div className="vault-panel p-6">
              <h2 className="font-display text-5xl leading-none">Access and money</h2>
              <div className="mt-6 grid gap-3">
                <label className="vault-fieldset flex items-center justify-between p-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-3"><Wallet className="h-4 w-4 text-brand" /> Paid creator</span>
                  <input type="checkbox" checked={Boolean(form.is_paid)} onChange={(event) => setForm({ ...form, is_paid: event.target.checked })} />
                </label>
                {form.is_paid ? (
                  <label className="block text-sm text-text-secondary">
                    Monthly price
                    <input value={form.price_monthly ?? 0} onChange={(event) => setForm({ ...form, price_monthly: event.target.value })} className="mt-2 w-full border border-base bg-transparent px-3 py-3 font-mono text-text-primary outline-none focus:border-brand" />
                  </label>
                ) : (
                  <label className="vault-fieldset flex items-center justify-between p-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-3"><Radio className="h-4 w-4 text-brand" /> Show donation total</span>
                    <input type="checkbox" checked={form.show_donation_total !== false} onChange={(event) => setForm({ ...form, show_donation_total: event.target.checked })} />
                  </label>
                )}
              </div>
            </div>

            <button type="submit" disabled={assetUploads.avatar_blob_id || assetUploads.cover_blob_id} className="interactive-control min-h-12 bg-brand px-5 font-mono text-sm text-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
              <Check className="mr-2 inline h-4 w-4" />
              {assetUploads.avatar_blob_id || assetUploads.cover_blob_id ? "Waiting for image upload" : "Save storefront settings"}
            </button>
          </section>
        </form>
      </section>
    </main>
  );
}
