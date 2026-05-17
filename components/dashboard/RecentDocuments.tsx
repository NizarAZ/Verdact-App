"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/components/WalletProvider";

type DocumentItem = {
  document_id?: string;
  title?: string;
  file_name?: string;
  size?: number;
  text_hash?: string;
  chunk_count?: number;
  shelby_blob?: string;
  blob_id?: string;
  onchain_tx_hash?: string;
  metaBlobName?: string;
  creationMicros?: number | string | null;
  created_at?: string | null;
  versionCount?: number;
};

function formatBytes(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes)) return "unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toMillis(document: DocumentItem) {
  if (document.created_at) {
    const parsed = Date.parse(document.created_at);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (typeof document.creationMicros === "number") {
    return Math.floor(document.creationMicros / 1000);
  }

  if (typeof document.creationMicros === "string") {
    const parsed = Number(document.creationMicros);
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
  }

  return null;
}

function relativeTime(document: DocumentItem) {
  const millis = toMillis(document);
  if (!millis) return "unknown";

  const elapsed = Date.now() - millis;
  const seconds = Math.max(0, Math.floor(elapsed / 1000));
  if (seconds < 45) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function documentKey(document: DocumentItem) {
  return document.document_id ?? document.metaBlobName ?? document.shelby_blob ?? document.file_name ?? "document";
}

export function RecentDocuments() {
  const { address, walletFetch } = useWallet();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDocuments() {
      if (!address) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const response = await walletFetch("/api/documents?limit=4", { cache: "no-store" });
        const payload = (await response.json()) as DocumentItem[];
        if (mounted) setDocuments(Array.isArray(payload) ? payload : []);
      } catch {
        if (mounted) setDocuments([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadDocuments();

    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [address, walletFetch]);

  if (isLoading) {
    return (
      <section className="rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-base p-5">
          <h2 className="font-display text-[24px] leading-none text-text-primary">Recent documents</h2>
        </div>
        <div className="space-y-3 p-5">
          <div className="h-14 w-full animate-pulse rounded-sm bg-white/5" />
          <div className="h-14 w-full animate-pulse rounded-sm bg-white/5" />
          <div className="h-14 w-full animate-pulse rounded-sm bg-white/5" />
        </div>
      </section>
    );
  }

  if (documents.length === 0) {
    return (
      <section className="rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-base p-5">
          <h2 className="font-display text-[24px] leading-none text-text-primary">Recent documents</h2>
        </div>
        <div className="p-5 text-center">
          <p className="font-body text-sm text-text-tertiary">
            No documents yet.{" "}
            <Link href="/app/upload" className="text-brand">
              Upload your first -&gt;
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-base p-5">
        <h2 className="font-display text-[24px] leading-none text-text-primary">Recent documents</h2>
        <div className="flex items-center gap-4">
          <Link href="/app/upload" prefetch={true} className="font-body text-[13px] text-brand">
            Upload <span aria-hidden="true">-&gt;</span>
          </Link>
          <Link href="/app/documents" prefetch={true} className="font-body text-[13px] text-brand">
            View all <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </div>

      <div>
        {documents.map((document, index) => (
          <motion.div
            key={documentKey(document)}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
          >
            <Link
              href="/app/documents"
              className="grid gap-3 border-b border-base p-5 transition-colors duration-150 ease-in last:border-b-0 hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
            >
              <span className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-brand" />
                <span className="min-w-0">
                  <span className="block truncate font-body text-sm text-text-primary">
                    {document.title ?? document.file_name ?? "Untitled document"}
                    {(document.versionCount ?? 1) > 1 ? <span className="text-text-tertiary"> ({document.versionCount} versions)</span> : null}
                  </span>
                  <span className="mt-1 block truncate font-body text-xs text-text-tertiary">{document.file_name ?? "Shelby document"}</span>
                </span>
              </span>
              <span className="inline-flex w-fit items-center rounded-sm border border-base bg-white/[0.03] px-2 py-1 font-mono text-xs text-text-secondary">
                {document.chunk_count ?? 0} chunks
              </span>
              <span className="font-mono text-xs text-text-tertiary">{formatBytes(document.size)}</span>
              <span className="font-mono text-xs text-text-tertiary">{relativeTime(document)}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
