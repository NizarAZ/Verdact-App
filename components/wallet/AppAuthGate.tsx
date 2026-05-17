"use client";

import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isReady } = useWallet();

  if (!isReady) {
    return <div className="font-mono text-sm text-text-tertiary">Checking wallet</div>;
  }

  if (!isConnected) {
    return (
      <section className="mx-auto max-w-[1100px]">
        <div className="max-w-md rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)]">
          <div className="flex min-h-[220px] flex-col items-center justify-center p-5 text-center">
            <p className="font-display text-[28px] leading-none text-text-primary">Connect wallet</p>
            <p className="mt-2 max-w-sm font-body text-sm text-text-tertiary">
              Connect Petra to unlock uploads, queries, receipts, and onchain proof.
            </p>
            <div className="mt-5">
              <WalletButton />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-base p-5">
            <span>
              <span className="block font-mono text-[11px] text-text-tertiary">status</span>
              <span className="mt-1 block font-mono text-xs text-text-secondary">wallet disconnected</span>
            </span>
            <Link href="/" className="font-mono text-xs text-brand">
              Back to landing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
