"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, FileArchive, Image as ImageIcon, PenLine, Radio, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { BackLink } from "@/components/ui/BackLink";
import { acceptedUploadInput, acceptedUploadTypes, maxUploadBytes } from "@/lib/constants";
import { waitForShelbynetTransaction } from "@/lib/client-chain";
import { createClientBlobRegistration, putShelbyBlobWithRetry, waitForShelbyBlobMetadata } from "@/lib/shelby-browser";
import { getShelbyBlobUrl } from "@/lib/shelby-explorer";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function shortBlobName(address: string, fileName: string) {
  const extension = (fileName.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? "").toLowerCase();
  const walletPart = address.replace(/^0x/, "").slice(-8);
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
  return sanitizeFileName(`c-${walletPart}-${randomPart}${extension}`).slice(0, 48);
}

async function fileBytes(file: File) {
  return new Uint8Array(await file.arrayBuffer());
}

function fileSize(size?: number) {
  if (!size) return "No file selected";
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function compactFileName(name: string, max = 58) {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot) : "";
  const base = dot > 0 ? name.slice(0, dot) : name;
  const room = Math.max(18, max - extension.length - 3);
  return `${base.slice(0, room)}...${extension}`;
}

export function VaultUploadClient() {
  const router = useRouter();
  const { address, isConnected, signAndSubmitTransaction, walletFetch } = useWallet();
  const [mode, setMode] = useState<"file" | "post">("file");
  const [file, setFile] = useState<File | null>(null);
  const [postBody, setPostBody] = useState("");
  const [postCover, setPostCover] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [visibility, setVisibility] = useState<"preview" | "locked" | "free">("preview");
  const [success, setSuccess] = useState<{ blobId: string; txHash: string } | null>(null);
  const [step, setStep] = useState<"idle" | "registering" | "signing" | "uploading" | "confirmed">("idle");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const derivedTitle = useMemo(() => title || file?.name.replace(/\.[^.]+$/, "") || (mode === "post" ? "Untitled post" : "Untitled upload"), [file, mode, title]);

  async function registerAndUploadBlob(blobFile: File, blobData: Uint8Array, statusLabel: string) {
    if (!address) throw new Error("Connect Petra before publishing.");
    const blobName = shortBlobName(address, blobFile.name);
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 60 * 60 * 1_000_000;
    setStep("registering");
    setStatus(`Preparing ${statusLabel}.`);
    const payload = await createClientBlobRegistration({
      walletAddress: address,
      blobName,
      blobData,
      expirationMicros
    });

    setStep("signing");
    const tx = await signAndSubmitTransaction(payload);
    await waitForShelbynetTransaction(tx.hash);
    setStatus(`Waiting for ${statusLabel} registration to become available.`);
    await waitForShelbyBlobMetadata({ walletAddress: address, blobName });

    setStep("uploading");
    await putShelbyBlobWithRetry({
      walletAddress: address,
      blobName,
      blobData,
      file: blobFile,
      walletFetch,
      onStatus: setStatus
    });

    return { blobName, txHash: tx.hash };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!address) return;
    setBusy(true);
    setStatus("");

    try {
      let uploadFile = file;
      if (mode === "post") {
        if (!title.trim()) throw new Error("Add a title before publishing a post.");
        if (!postBody.trim()) throw new Error("Write the post before publishing.");
        const postFileName = `${sanitizeFileName(title.trim()) || "post"}.md`;
        uploadFile = new File([postBody], postFileName, { type: "text/markdown" });
      }

      if (!uploadFile) return;
      if (uploadFile.size > maxUploadBytes) throw new Error("Files are limited to 100MB.");
      const typeAllowed = acceptedUploadTypes.includes(uploadFile.type) || uploadFile.name.endsWith(".md");
      if (!typeAllowed) throw new Error("Unsupported file type.");

      let thumbnailBlobId = "";
      if (mode === "post" && postCover) {
        if (postCover.size > maxUploadBytes) throw new Error("Post cover is limited to 100MB.");
        if (!postCover.type.startsWith("image/")) throw new Error("Post cover must be an image.");
        const coverResult = await registerAndUploadBlob(postCover, await fileBytes(postCover), "post cover");
        thumbnailBlobId = coverResult.blobName;
      }

      const bytes = await fileBytes(uploadFile);
      const { blobName, txHash } = await registerAndUploadBlob(uploadFile, bytes, mode === "post" ? "post body" : "file");

      setStep("confirmed");
      setStatus("Saving storefront metadata.");
      const response = await walletFetch("/api/vault/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: derivedTitle,
          description,
          file_type: uploadFile.type || (uploadFile.name.endsWith(".md") ? "text/markdown" : "application/octet-stream"),
          file_name: uploadFile.name,
          blob_id: blobName,
          onchain_tx_hash: txHash,
          size_bytes: uploadFile.size,
          thumbnail_blob_id: thumbnailBlobId || null,
          allow_download: allowDownload,
          visibility,
          is_preview: visibility === "preview" || visibility === "free",
          is_locked: visibility === "locked"
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to save content.");
      setSuccess({ blobId: blobName, txHash });
      window.setTimeout(() => router.push("/vault"), 1800);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!isConnected) {
    return (
      <main className="vault-page min-h-screen">
        <section className="container-shell py-8">
          <BackLink href="/vault" label="Back to vault" className="mb-8" />
          <div className="vault-empty p-8">
            <h1 className="font-display text-6xl leading-none">Connect Petra to publish.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-text-tertiary">Uploads register Shelby blobs from the connected wallet before metadata is saved to Verdact.</p>
            <div className="relative z-10 mt-6">
              <WalletButton />
            </div>
          </div>
        </section>
      </main>
    );
  }

  const steps = [
    ["registering", "Prepare blob"],
    ["signing", "Wallet signature"],
    ["uploading", "Shelby upload"],
    ["confirmed", "Published"]
  ] as const;

  return (
    <main className="vault-page min-h-screen">
      <section className="container-shell py-8">
        <BackLink href="/vault" label="Back to vault" className="mb-8" />

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="vault-panel p-6">
            <p className="font-mono text-xs text-brand">PUBLISH TO SHELBY</p>
            <h1 className="mt-5 max-w-2xl font-display text-7xl leading-none text-text-primary">Upload the next object in your vault.</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-text-tertiary">The file is registered onchain, stored as a Shelby blob, then listed in your public storefront metadata.</p>

            <div className="mt-8 grid grid-cols-2 border border-base font-mono text-xs">
              <button type="button" onClick={() => setMode("file")} className={`interactive-control min-h-11 border-r border-base ${mode === "file" ? "bg-brand text-brand-dark" : "text-text-tertiary"}`}>
                Upload file
              </button>
              <button type="button" onClick={() => setMode("post")} className={`interactive-control min-h-11 ${mode === "post" ? "bg-brand text-brand-dark" : "text-text-tertiary"}`}>
                Write post
              </button>
            </div>

            {mode === "file" ? (
              <label className="interactive-control vault-upload-drop mt-4 flex cursor-pointer flex-col justify-between p-6">
                <UploadCloud className="h-9 w-9 text-brand" />
                <div>
                  <p className="max-w-full overflow-hidden break-words font-display text-3xl leading-none text-text-primary md:text-4xl" title={file?.name}>
                    {file ? compactFileName(file.name) : "Choose a file"}
                  </p>
                  <p className="mt-2 font-mono text-xs text-text-tertiary">{fileSize(file?.size)}</p>
                  <p className="mt-4 max-w-lg text-xs leading-5 text-text-tertiary">MP4, MOV, JPG, PNG, GIF, PDF, TXT, MD, DOCX, PPTX, CSV, JSON / 100MB max</p>
                </div>
                <input type="file" accept={acceptedUploadInput} className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
            ) : (
              <div className="vault-upload-drop mt-4 flex flex-col justify-between p-6">
                <PenLine className="h-9 w-9 text-brand" />
                <div className="mt-10 grid gap-4">
                  <label className="block text-sm text-text-secondary">
                    Post body
                    <textarea
                      value={postBody}
                      onChange={(event) => setPostBody(event.target.value)}
                      placeholder="Write the post that will be stored as a Shelby markdown blob."
                      className="mt-2 min-h-56 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand"
                    />
                  </label>
                  <label className="interactive-control flex min-h-12 cursor-pointer items-center justify-between gap-3 border border-base px-3 font-mono text-xs text-text-tertiary">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-brand" />
                      <span className="truncate">{postCover ? compactFileName(postCover.name, 44) : "Add optional post picture"}</span>
                    </span>
                    <span>{fileSize(postCover?.size)}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => setPostCover(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-6">
            <div className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Metadata</h2>
              <div className="mt-5 grid gap-4">
                <label className="block text-sm text-text-secondary">
                  Title
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={file?.name || "Name the upload"} className="mt-2 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
                </label>
                <label className="block text-sm text-text-secondary">
                  Description
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28 w-full border border-base bg-transparent px-3 py-3 text-text-primary outline-none focus:border-brand" />
                </label>
              </div>
            </div>

            <div className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Access</h2>
              <div className="mt-5 grid gap-3">
                <label className="vault-fieldset flex items-center justify-between p-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-3"><FileArchive className="h-4 w-4 text-brand" /> Allow download</span>
                  <input type="checkbox" checked={allowDownload} onChange={(event) => setAllowDownload(event.target.checked)} />
                </label>
                <label className="block text-sm text-text-secondary">
                  Who can see this file?
                  <select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value as "preview" | "locked" | "free")}
                    className="mt-2 w-full border border-base bg-transparent px-3 py-3 font-mono text-xs text-text-primary outline-none focus:border-brand"
                  >
                    <option value="preview">Public Preview</option>
                    <option value="locked">Locked (subscribers only)</option>
                    <option value="free">Free/Public</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="vault-panel p-5">
              <h2 className="font-display text-4xl leading-none">Publishing rail</h2>
              <div className="mt-5 grid gap-2">
                {steps.map(([key, label]) => {
                  const active = step === key || (key === "confirmed" && step === "confirmed");
                  return (
                    <div key={key} className={`flex items-center justify-between border px-3 py-3 font-mono text-xs ${active ? "border-brand text-text-primary" : "border-base text-text-tertiary"}`}>
                      <span>{label}</span>
                      {active ? <Check className="h-3.5 w-3.5 text-brand" /> : <Radio className="h-3.5 w-3.5" />}
                    </div>
                  );
                })}
              </div>
              <button type="submit" disabled={busy || (mode === "file" ? !file : !postBody.trim())} className="interactive-control mt-5 min-h-12 w-full bg-brand px-4 font-mono text-sm text-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Publishing" : "Publish to vault"}
              </button>
              {success ? (
                <div className="upload-success mt-4 border border-base p-3 font-mono text-xs text-text-secondary">
                  <p className="text-brand">File stored on Shelby Protocol</p>
                  <p className="mt-2">Blob ID: <code>{success.blobId}</code></p>
                  <a href={getShelbyBlobUrl(address, success.blobId)} target="_blank" rel="noreferrer" className="interactive-control mt-2 inline-flex text-brand">
                    Verify on Shelby Explorer
                  </a>
                </div>
              ) : null}
              {status ? <p className="mt-4 text-sm text-red-300">{status}</p> : null}
            </div>
          </section>
        </form>
      </section>
    </main>
  );
}
