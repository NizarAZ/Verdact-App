"use client";

import { LogOut, Wallet } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, connect, disconnect, isConnecting, isConnected } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-[var(--radius-md)] border border-base px-3 py-2 font-mono text-xs text-text-secondary">
          {shorten(address)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-base text-text-tertiary transition-colors duration-150 ease-in hover:border-strong hover:text-text-primary"
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
        onClick={connect}
        disabled={isConnecting}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark transition-opacity duration-150 ease-in disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting" : compact ? "Connect" : "Connect Wallet"}
      </button>
    </div>
  );
}
