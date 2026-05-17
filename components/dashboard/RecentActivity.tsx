"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { useWallet } from "@/components/WalletProvider";

type Receipt = {
  receipt_id?: string;
  id?: string;
  question?: string;
  model?: string;
  timestamp?: number;
  sources?: unknown[];
  total_chunks_retrieved?: number;
  context_hash?: string;
  receipt_hash?: string;
  onchain_tx_hash?: string;
  blobName?: string;
  creationMicros?: number | string | null;
  created_at?: string | null;
};

function toMillis(receipt: Receipt) {
  if (receipt.created_at) {
    const parsed = Date.parse(receipt.created_at);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof receipt.timestamp === "number") {
    return receipt.timestamp > 9_999_999_999 ? receipt.timestamp : receipt.timestamp * 1000;
  }

  if (typeof receipt.creationMicros === "number") {
    return Math.floor(receipt.creationMicros / 1000);
  }

  if (typeof receipt.creationMicros === "string") {
    const parsed = Number(receipt.creationMicros);
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
  }

  return null;
}

function relativeTime(receipt: Receipt) {
  const millis = toMillis(receipt);
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

function receiptId(receipt: Receipt) {
  return receipt.receipt_id ?? receipt.id ?? receipt.blobName ?? "receipt";
}

function sourceCount(receipt: Receipt) {
  if (Array.isArray(receipt.sources)) return receipt.sources.length;
  return receipt.total_chunks_retrieved ?? 0;
}

function receiptHref(receipt: Receipt) {
  return `/verify/${encodeURIComponent(receiptId(receipt))}`;
}

export function RecentActivity() {
  const { walletFetch } = useWallet();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadReceipts() {
      try {
        const response = await walletFetch("/api/receipts?limit=3", { cache: "no-store" });
        const payload = (await response.json()) as Receipt[];
        if (mounted) setReceipts(Array.isArray(payload) ? payload : []);
      } catch {
        if (mounted) setReceipts([]);
      } finally {
        if (mounted) setLoaded(true);
      }
    }

    loadReceipts();

    return () => {
      mounted = false;
    };
  }, [walletFetch]);

  if (receipts.length === 0) {
    if (!loaded) return null;

    return (
      <section className="rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-brand" />
            <div>
              <h2 className="font-display text-[24px] leading-none text-text-primary">No receipts yet</h2>
              <p className="mt-1 font-body text-sm text-text-tertiary">
                Ask a question after upload to create the first receipt ID.
              </p>
            </div>
          </div>
          <Link
            href="/app/query"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark"
          >
            Ask AI
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-base p-5">
        <h2 className="font-display text-[24px] leading-none text-text-primary">Recent receipts</h2>
        <Link href="/app/receipts" className="font-body text-[13px] text-brand">
          View all
          <span aria-hidden="true"> -&gt;</span>
        </Link>
      </div>

      <div>
        {receipts.map((receipt, index) => {
          const sources = sourceCount(receipt);
          const verified = Boolean(receipt.receipt_hash);

          return (
            <motion.div
              key={`${receiptId(receipt)}-${receipt.blobName ?? ""}`}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
            >
              <Link
                href={receiptHref(receipt)}
                className="grid gap-3 border-b border-base p-5 transition-colors duration-150 ease-in last:border-b-0 hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
              >
                <span className="truncate font-body text-sm text-text-primary">
                  {(receipt.question ?? "Untitled receipt").slice(0, 60)}
                </span>
                <span className="font-body text-xs text-text-tertiary">{sources} sources</span>
                <span className="font-mono text-xs text-text-tertiary">{relativeTime(receipt)}</span>
                <VerifiedBadge verified={verified} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
