"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { BlobTag } from "@/components/shared/BlobTag";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { useWallet } from "@/components/WalletProvider";

type Receipt = {
  receipt_id: string;
  wallet_address?: string;
  question: string;
  answer: string;
  model?: string;
  context_hash: string;
  receipt_hash?: string;
  onchain_tx_hash?: string;
  created_at?: string | null;
  verified?: boolean;
  sources: { text: string; chunk_blob: string; context_hash: string }[];
};

function truncateMiddle(value: string, start = 18, end = 14) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function ReceiptDetail({ id }: { id: string }) {
  const { walletFetch } = useWallet();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadReceipt() {
      try {
        const response = await walletFetch(`/api/receipts/${encodeURIComponent(id)}`, { cache: "no-store" });
        const payload = await response.json();
        if (mounted) setReceipt(response.ok ? (payload as Receipt) : null);
      } catch {
        if (mounted) setReceipt(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReceipt();

    return () => {
      mounted = false;
    };
  }, [id, walletFetch]);

  return (
    <div>
      <BackToDashboard />
      <section className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
        <div className="border-b border-base p-8">
          <h1 className="font-display text-3xl text-text-primary">Receipt detail</h1>
          <p className="mt-2 font-mono text-xs text-text-secondary">{decodeURIComponent(id)}</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-8">
            <span className="stats-skeleton block h-20 rounded-sm" />
            <span className="stats-skeleton block h-40 rounded-sm" />
          </div>
        ) : !receipt ? (
          <div className="p-8">
            <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-5 text-center">
              <p className="font-display text-2xl text-text-primary">Receipt not found.</p>
              <p className="mt-2 font-body text-sm text-text-secondary">The receipt ID does not exist in this workspace.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="rounded-[var(--radius-md)] border border-base bg-bg-base p-6">
              <p className="font-body text-sm text-text-tertiary">question</p>
              <p className="mt-2 font-body text-lg text-text-primary">{receipt.question}</p>
              <div className="my-6 border-t border-base" />
              <p className="font-body text-sm text-text-tertiary">answer</p>
              <p className="mt-8 whitespace-pre-wrap font-body text-sm leading-6 text-text-primary">{receipt.answer}</p>
            </article>
            <aside className="rounded-[var(--radius-md)] border border-base bg-bg-base p-5">
              <VerifiedBadge verified={Boolean(receipt.receipt_hash)} />
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="font-body text-xs text-text-tertiary">receipt hash</dt>
                  <dd className="mt-1 font-mono text-xs text-text-secondary">{truncateMiddle(receipt.receipt_hash ?? receipt.context_hash)}</dd>
                </div>
                <div>
                  <dt className="font-body text-xs text-text-tertiary">wallet</dt>
                  <dd className="mt-1 font-mono text-xs text-text-secondary">{truncateMiddle(receipt.wallet_address ?? "unknown", 16, 10)}</dd>
                </div>
              </dl>
              <Link
                href={`/verify/${encodeURIComponent(receipt.receipt_id)}`}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark"
              >
                Verify receipt
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </aside>
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl text-text-primary">Sources</h2>
                <BlobTag value={`${receipt.sources.length} sources`} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {receipt.sources.map((source, index) => (
                  <div key={`${source.chunk_blob}-${index}`} className="rounded-[var(--radius-md)] border border-base bg-bg-base p-5">
                    <p className="font-mono text-xs text-text-tertiary">{truncateMiddle(source.chunk_blob, 28, 18)}</p>
                    <p className="mt-3 line-clamp-4 font-body text-sm leading-6 text-text-secondary">{source.text}</p>
                  </div>
                ))}
              </div>
              <Link href="/app/receipts" className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-brand">
                Back to receipts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
