"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, FileText, RotateCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { ShelbyLogo } from "@/components/shelby-logo";
import { getShelbyAccountBlobsUrl, getShelbyBlobUrl } from "@/lib/shelby-explorer";

type Receipt = {
  id: string;
  wallet_address: string;
  created_at?: string | null;
  query: string;
  answer: string;
  blob_ids_used: string[];
  blobs_used?: ReceiptBlobReference[];
  receipt_hash: string;
};

type ReceiptBlobReference = {
  path: string;
  tx_hash?: string | null;
  file_name?: string | null;
};

type VerificationResult = {
  receipt: Receipt | null;
  hashMatches: boolean;
  recomputedHash: string;
  error?: string;
};

function truncateMiddle(value?: string | null, start = 14, end = 10) {
  if (!value) return "not found";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "unknown";
  return new Date(value).toLocaleString();
}

function getBlobExplorerUrl(blob: ReceiptBlobReference, walletAddress: string) {
  if (!blob.path) {
    return getShelbyAccountBlobsUrl(walletAddress);
  }

  return getShelbyBlobUrl(walletAddress, blob.path);
}

function getReceiptBlobs(receipt: Receipt): ReceiptBlobReference[] {
  return receipt.blobs_used ?? receipt.blob_ids_used.map((path) => ({ path }));
}

function DetailRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-b border-base p-6 odd:md:border-r">
      <dt className="font-body text-xs text-text-tertiary">{label}</dt>
      <dd className="mt-2 flex min-w-0 items-center gap-3">
        <span className="min-w-0 break-all font-mono text-sm text-text-primary">{value}</span>
        {copyValue ? (
          <button
            type="button"
            onClick={() => handleCopy(copyValue)}
            className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-2 font-mono text-xs transition-colors duration-150 ease-in ${
              copied
                ? "border-[color:var(--success)] text-[color:var(--success)]"
                : "border-base text-text-secondary hover:border-strong hover:text-text-primary"
            }`}
          >
            {copied ? null : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        ) : null}
      </dd>
    </div>
  );
}

export function PublicVerify({ id }: { id: string }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadVerification() {
    setLoading(true);
    try {
      const response = await fetch(`/api/public-verify?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = (await response.json()) as VerificationResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Receipt not found");
      }

      setResult(payload);
    } catch (error) {
      setResult({
        receipt: null,
        hashMatches: false,
        recomputedHash: "",
        error: error instanceof Error ? error.message : "Verification failed"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerification();
  }, [id]);

  return (
    <main className="app-dashboard min-h-screen">
      <header className="border-b border-base">
        <div className="container-shell flex min-h-20 items-center justify-between gap-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <ShelbyLogo className="h-10 w-10" />
            <span className="font-display text-xl font-bold text-text-primary">Verdact Verify</span>
          </Link>
          <span className="inline-flex items-center gap-2 font-mono text-sm text-text-tertiary">
            receipt {truncateMiddle(id, 10, 8)}
          </span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[860px] px-5 py-12">
        <BackToDashboard />
        <div className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
          <div className="border-b border-base p-8">
            <div className="flex items-center gap-3">
              {loading ? (
                <ShieldAlert className="h-5 w-5 text-text-tertiary" />
              ) : result?.hashMatches ? (
                <Check className="h-5 w-5 text-brand" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-text-tertiary" />
              )}
              <h1 className="font-display text-3xl text-text-primary">
                {loading ? "Checking receipt" : result?.hashMatches ? "Receipt verified" : "Receipt check failed"}
              </h1>
            </div>
            {result?.error ? <p className="mt-3 font-body text-sm text-text-secondary">{result.error}</p> : null}
          </div>

          {result?.receipt ? (
            <>
              <dl className="grid gap-0 md:grid-cols-2">
                <DetailRow label="wallet address" value={truncateMiddle(result.receipt.wallet_address)} />
                <DetailRow label="created at" value={formatTimestamp(result.receipt.created_at)} />
                <DetailRow label="receipt id" value={truncateMiddle(result.receipt.id, 18, 14)} copyValue={result.receipt.id} />
                <DetailRow
                  label="receipt hash"
                  value={truncateMiddle(result.receipt.receipt_hash, 18, 14)}
                  copyValue={result.receipt.receipt_hash}
                />
              </dl>

              <div className="border-b border-base p-8">
                <p className="font-body text-xs text-text-tertiary">question</p>
                <p className="mt-3 font-body text-sm text-text-primary">{result.receipt.query}</p>
              </div>

              <div className="border-b border-base p-8">
                <p className="font-body text-xs text-text-tertiary">answer</p>
                <p className="mt-3 whitespace-pre-wrap font-body text-sm leading-6 text-text-primary">{result.receipt.answer}</p>
              </div>

              <div className="border-b border-base p-8">
                <p className="font-body text-xs text-text-tertiary">source blobs ({getReceiptBlobs(result.receipt).length})</p>
                <div className="mt-3 space-y-2">
                  {getReceiptBlobs(result.receipt).map((blob, index) => (
                    <a
                      key={`${blob.path}-${index}`}
                      href={getBlobExplorerUrl(blob, result.receipt!.wallet_address)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-mono text-xs text-brand"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{truncateMiddle(blob.file_name || blob.path, 24, 16)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="border-b border-base p-8">
                <p className="font-body text-xs text-text-tertiary">recomputed receipt hash</p>
                <p className="mt-2 break-all font-mono text-xs text-text-secondary">{result.recomputedHash}</p>
                <p className="mt-2 font-body text-xs text-text-tertiary">
                  {result.hashMatches ? "Hash matches - answer unchanged" : "Hash mismatch - answer may have been altered"}
                </p>
              </div>

              <div className="p-8">
                <button
                  type="button"
                  onClick={loadVerification}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Re-run verification
                </button>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
