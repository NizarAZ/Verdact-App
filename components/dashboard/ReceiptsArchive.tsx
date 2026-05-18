"use client";

import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { useWallet } from "@/components/WalletProvider";

type Receipt = {
  receipt_id?: string;
  question?: string;
  model?: string;
  sources?: unknown[];
  context_hash?: string;
  receipt_hash?: string;
  onchain_tx_hash?: string;
  verified?: boolean;
  blobName?: string;
};

function receiptId(receipt: Receipt) {
  return receipt.receipt_id ?? receipt.blobName ?? "receipt";
}

export function ReceiptsArchive() {
  const { address, walletFetch } = useWallet();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadReceipts() {
      if (!address) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const response = await walletFetch("/api/receipts?limit=25", { cache: "no-store" });
        const payload = await response.json();
        if (mounted) setReceipts(Array.isArray(payload) ? payload : []);
      } catch {
        if (mounted) setReceipts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReceipts();

    return () => {
      mounted = false;
    };
  }, [address, walletFetch]);

  return (
    <div>
      <BackToDashboard />
      <section className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
        <div className="border-b border-base p-8">
          <h1 className="font-display text-3xl text-text-primary">Receipts</h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-text-secondary">Answer receipts indexed by Supabase receipt ID.</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-8">
            <span className="stats-skeleton block h-14 rounded-sm" />
            <span className="stats-skeleton block h-14 rounded-sm" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-display text-2xl text-text-primary">No receipts yet.</p>
            <p className="mt-2 font-body text-sm text-text-tertiary">Ask a question to create the first receipt.</p>
          </div>
        ) : (
          <div>
            {receipts.map((receipt) => (
              <Link
                key={receiptId(receipt)}
                href={`/verify/${encodeURIComponent(receiptId(receipt))}`}
                className="group grid gap-3 border-b border-base p-8 transition-colors duration-150 ease-in last:border-b-0 hover:bg-bg-surface md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ScrollText className="h-4 w-4 shrink-0 text-brand" />
                  <span className="truncate font-body text-sm text-text-primary">{receipt.question ?? "Untitled receipt"}</span>
                </span>
                <span className="font-mono text-xs text-text-tertiary">{receipt.receipt_hash ? `${receipt.receipt_hash.slice(0, 10)}...${receipt.receipt_hash.slice(-8)}` : "no hash"}</span>
                <VerifiedBadge verified={Boolean(receipt.receipt_hash)} />
                <ArrowRight className="hidden h-4 w-4 text-text-tertiary opacity-0 transition-opacity duration-150 ease-in group-hover:opacity-100 md:block" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
