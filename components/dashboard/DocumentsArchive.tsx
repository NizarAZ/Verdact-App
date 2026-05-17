"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { BlobTag } from "@/components/shared/BlobTag";
import { useWallet } from "@/components/WalletProvider";
import { getShelbyBlobUrl } from "@/lib/shelby-explorer";

type DocumentItem = {
  document_id?: string;
  title?: string;
  file_name?: string;
  size?: number;
  text_hash?: string;
  file_hash?: string;
  chunk_count?: number;
  shelby_blob?: string;
  blob_id?: string;
  onchain_tx_hash?: string;
  metaBlobName?: string;
  creationMicros?: number | string | null;
};

function formatBytes(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes)) return "unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function shortHash(value?: string) {
  if (!value) return "no hash";
  return value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

function documentKey(document: DocumentItem) {
  return document.document_id ?? document.metaBlobName ?? document.shelby_blob ?? document.file_name ?? "document";
}

export function DocumentsArchive() {
  const { address, walletFetch } = useWallet();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDocuments() {
      // Guard: don't fetch until wallet is connected
      if (!address) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const response = await walletFetch("/api/documents?limit=50", { cache: "no-store" });
        const payload = (await response.json()) as DocumentItem[];
        if (mounted) setDocuments(Array.isArray(payload) ? payload : []);
      } catch {
        if (mounted) setDocuments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDocuments();

    // Timeout fallback: force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [address, walletFetch]);

  return (
    <div>
      <BackToDashboard />
      <section className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
        <div className="border-b border-base p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-3xl text-text-primary">Documents</h1>
              <p className="mt-2 max-w-2xl font-body text-sm text-text-secondary">
                Files registered as Shelby blobs and indexed for retrieval.
              </p>
            </div>
            <Link
              href="/app/upload"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark"
            >
              Upload document
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-8">
            <span className="stats-skeleton block h-14 rounded-sm" />
            <span className="stats-skeleton block h-14 rounded-sm" />
            <span className="stats-skeleton block h-14 rounded-sm" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-display text-2xl text-text-primary">No documents yet.</p>
            <p className="mt-2 font-body text-sm text-text-tertiary">Upload a document to build your Shelby-backed index.</p>
            <Link
              href="/app/upload"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark"
            >
              Upload document
            </Link>
          </div>
        ) : (
          <div>
            {documents.map((document) => (
              <div
                key={documentKey(document)}
                className="grid gap-3 border-b border-base p-8 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm text-text-primary">{document.title ?? document.file_name ?? "Untitled document"}</p>
                    <p className="mt-1 truncate font-body text-xs text-text-tertiary">{document.blob_id ?? document.shelby_blob ?? document.metaBlobName}</p>
                  </div>
                </div>
                <BlobTag value={`${document.chunk_count ?? 0} chunks`} />
                <BlobTag value={shortHash(document.blob_id ?? document.shelby_blob)} />
                <span className="font-mono text-xs text-text-tertiary">{formatBytes(document.size)}</span>
                {address && (document.blob_id || document.shelby_blob) ? (
                  <a
                    href={getShelbyBlobUrl(address, document.blob_id ?? document.shelby_blob ?? "")}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-brand"
                  >
                    View Shelby
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
