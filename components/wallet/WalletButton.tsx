"use client";

import { useState } from "react";
import { LogOut, Wallet } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { normalizeWalletAddress } from "@/lib/wallet";

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { account, connect, disconnect, isConnected } = useWallet();
  const [pending, setPending] = useState(false);
  const address = normalizeWalletAddress(account?.address?.toString());

  async function handleConnect() {
    if (pending) return;
    setPending(true);
    try {
      await connect();
    } finally {
      window.setTimeout(() => setPending(false), 1200);
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-[var(--radius-md)] border border-base px-3 py-2 font-mono text-xs text-text-secondary">
          {shorten(address)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="interactive-control inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-base text-text-tertiary transition-colors duration-150 ease-in hover:border-strong hover:text-text-primary"
          aria-label="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleConnect}
        aria-busy={pending}
        className="interactive-control inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark"
      >
        <Wallet className="h-4 w-4" />
        {pending ? "Opening Petra" : compact ? "Connect" : "Connect Wallet"}
      </button>
    </div>
  );
}
