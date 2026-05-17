"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useWallet } from "@/components/WalletProvider";

type UploadResult = {
  documentId: string;
  title: string;
  fileName: string;
  chunkCount: number;
  fileHash: string;
  blobId: string;
  onchainTxHash: string;
  metadataWarning?: string | null;
};

type PreparedUpload = {
  documentId: string;
  title: string;
  fileName: string;
  chunkCount: number;
  fileHash: string;
  blobId: string;
  txPayload: unknown;
  error?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateMiddle(value: string, start = 18, end = 14) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatSeconds(ms: number) {
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}

export function UploadFlow() {
  const { address, signAndSubmitTransaction, walletFetch } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "signing" | "confirming" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalElapsedMs, setFinalElapsedMs] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const derivedTitle = useMemo(() => title || file?.name.replace(/\.[^.]+$/, "") || "", [file, title]);
  const canSubmit = Boolean(file && !["uploading", "signing", "confirming"].includes(status));
  const blobUrl = address && result?.blobId
    ? `${process.env.NEXT_PUBLIC_SHELBY_RPC_URL || "https://api.shelbynet.shelby.xyz/shelby"}/v1/blobs/${encodeURIComponent(address)}/${result.blobId
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")}`
    : null;
  const txUrl = txHash ? `https://explorer.aptoslabs.com/txn/${encodeURIComponent(txHash)}?network=shelbynet` : null;

  useEffect(() => {
    if (!startedAt || !["uploading", "signing", "confirming"].includes(status)) {
      return;
    }

    const update = () => setElapsedMs(Date.now() - startedAt);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [startedAt, status]);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setTitle(nextFile?.name.replace(/\.[^.]+$/, "") ?? "");
    setResult(null);
    setError("");
    setStatus("idle");
    setStartedAt(null);
    setElapsedMs(0);
    setFinalElapsedMs(null);
    setTxHash(null);
  }

  function clearFile() {
    setFile(null);
    setTitle("");
    setResult(null);
    setError("");
    setStatus("idle");
    setStartedAt(null);
    setElapsedMs(0);
    setFinalElapsedMs(null);
    setTxHash(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setError("");
    setResult(null);
    setTxHash(null);
    const started = Date.now();
    setStartedAt(started);
    setElapsedMs(0);
    setFinalElapsedMs(null);

    const form = new FormData();
    form.append("file", file);
    form.append("title", derivedTitle);
    form.append("walletAddress", address || "");

    try {
      const response = await walletFetch("/api/upload", {
        method: "POST",
        body: form
      });
      const text = await response.text();
      const payload = text ? (JSON.parse(text) as PreparedUpload) : ({} as PreparedUpload);

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setStatus("signing");
      const nextTxHash = (await signAndSubmitTransaction(payload.txPayload)).hash;
      setTxHash(nextTxHash);
      setStatus("confirming");

      const confirmForm = new FormData();
      confirmForm.append("file", file);
      confirmForm.append("title", derivedTitle);
      confirmForm.append("documentId", payload.documentId);
      confirmForm.append("blobId", payload.blobId);
      confirmForm.append("fileHash", payload.fileHash);
      confirmForm.append("onchainTxHash", nextTxHash);
      confirmForm.append("walletAddress", address || "");

      const confirmResponse = await walletFetch("/api/upload/confirm", {
        method: "POST",
        body: confirmForm
      });
      const confirmPayload = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmPayload.error ?? "Upload confirmation failed.");
      }

      setResult(confirmPayload as UploadResult);
      setFinalElapsedMs(Date.now() - started);
      setStatus("done");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setFinalElapsedMs(Date.now() - started);
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[600px]">
      <BackToDashboard />
      <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
        <div className="border-b border-base p-8">
          <h1 className="font-display text-3xl text-text-primary">Upload document</h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-text-secondary">
            Store a readable document as Shelby blobs, then index its chunks for retrieval.
          </p>
        </div>

        <div className="space-y-6 p-8">
          <input ref={inputRef} type="file" accept=".txt,.md,.markdown,.json,.csv,.pdf,text/*,application/json,application/pdf" className="hidden" onChange={pickFile} />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-48 w-full flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-base bg-bg-base p-8 text-center transition-colors duration-150 ease-in hover:border-strong hover:bg-bg-elevated"
          >
            <UploadCloud className="h-7 w-7 text-brand" />
            <span className="mt-4 font-display text-xl text-text-primary">Choose a document</span>
            <span className="mt-2 font-body text-sm text-text-tertiary">Text, markdown, JSON, CSV, or PDF up to 2 MB</span>
          </button>

          {file ? (
            <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-base bg-bg-base p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="truncate font-body text-sm text-text-primary">{file.name}</p>
                  <p className="mt-1 font-mono text-xs text-text-tertiary">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-base text-text-tertiary transition-colors duration-150 ease-in hover:border-strong hover:text-text-primary"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block font-body text-sm text-text-secondary">Document title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Policy handbook"
              className="h-12 w-full rounded-[var(--radius-md)] border border-base bg-bg-base px-4 font-body text-sm text-text-primary outline-none transition-colors duration-150 ease-in placeholder:text-text-tertiary focus:border-strong"
            />
          </label>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-4 font-body text-sm text-text-secondary">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-5 font-mono text-sm font-medium text-brand-dark transition-opacity duration-150 ease-in disabled:cursor-not-allowed disabled:opacity-45"
          >
            {status === "uploading"
              ? "Uploading to Shelby"
              : status === "signing"
                ? "Signing transaction"
                : status === "confirming"
                  ? "Indexing document"
                  : "Upload to Shelby"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {["uploading", "signing", "confirming", "done"].includes(status) ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-base bg-bg-base p-4 font-body text-sm">
              {status !== "done" && (
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-text-tertiary">elapsed</span>
                  <span className="font-mono text-xs text-text-primary">{formatSeconds(elapsedMs)}</span>
                </div>
              )}
              {[
                {
                  label: "Uploading to Shelby",
                  active: status === "uploading",
                  complete: status === "done",
                  detail: file ? `${formatBytes(file.size)} prepared for blob registration` : "Preparing upload"
                },
                {
                  label: "Signing transaction",
                  active: status === "signing",
                  complete: status === "confirming" || status === "done",
                  detail: "Waiting for Petra approval..."
                },
                {
                  label: "Confirmed and indexed",
                  active: status === "confirming",
                  complete: status === "done",
                  detail: status === "confirming" ? "Saving metadata and chunks..." : txUrl && txHash ? `tx ${txHash.slice(0, 10)}...${txHash.slice(-6)}` : "Waiting for confirmation"
                }
              ].map((step) => (
                <div key={step.label} className="flex items-start gap-3">
                  {step.complete ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  ) : (
                    <Loader2 className={`mt-0.5 h-4 w-4 shrink-0 ${step.active ? "animate-spin text-brand" : "text-text-tertiary"}`} />
                  )}
                  <div className="min-w-0">
                    <p className={step.active || step.complete ? "text-text-primary" : "text-text-tertiary"}>{step.label}</p>
                    {step.label === "Confirmed and indexed" && txUrl && txHash ? (
                      <a href={txUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex font-mono text-xs text-brand">
                        tx {txHash.slice(0, 10)}...{txHash.slice(-6)} ↗
                      </a>
                    ) : (
                      <p className="mt-1 font-mono text-xs text-text-tertiary">{step.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-5">
              <div className="flex items-center gap-2 font-body text-sm text-text-primary">
                <Check className="h-4 w-4 text-brand" />
                Confirmed onchain
              </div>
              {finalElapsedMs !== null ? <p className="mt-2 font-mono text-xs text-text-tertiary">Confirmed in {formatSeconds(finalElapsedMs)}</p> : null}
              <p className="mt-4 font-body text-sm text-text-primary">{result.title || derivedTitle}</p>
              <div className="mt-3 space-y-2 font-mono text-xs text-text-secondary">
                <p>{result.chunkCount} chunks</p>
                <a
                  href={`https://explorer.aptoslabs.com/txn/${encodeURIComponent(result.onchainTxHash)}?network=shelbynet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-brand"
                >
                  tx {result.onchainTxHash.slice(0, 10)}...{result.onchainTxHash.slice(-6)} ↗
                </a>
              </div>
              {result.metadataWarning ? <p className="mt-3 font-body text-xs text-text-tertiary">{result.metadataWarning}</p> : null}
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/app/query" className="inline-flex items-center gap-2 font-mono text-sm text-brand">
                  Ask a question about this document
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/app" className="inline-flex items-center gap-2 font-mono text-sm text-text-secondary hover:text-text-primary">
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
