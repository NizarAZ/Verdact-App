"use client";

import { useState } from "react";
import { ExternalLink, LogOut, Wallet, X } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { normalizeWalletAddress } from "@/lib/wallet";

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { account, connect, disconnect, isConnected } = useWallet();
  const [pending, setPending] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [error, setError] = useState("");
  const address = normalizeWalletAddress(account?.address?.toString());

  async function handleConnect() {
    if (pending) return;
    if (typeof window !== "undefined" && !("petra" in window)) {
      setShowInstall(true);
      return;
    }
    setPending(true);
    setError("");
    try {
      await connect();
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "Petra connection failed.";
      setError(message);
      if (/petra|wallet|not installed|not found/i.test(message)) setShowInstall(true);
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
      {error && !showInstall ? <span className="ml-3 max-w-44 text-xs text-text-tertiary">{error}</span> : null}
      {showInstall ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md border border-base bg-[color:var(--color-bg)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl leading-none text-text-primary">Install Petra Wallet</h2>
                <p className="mt-3 text-sm leading-6 text-text-tertiary">
                  Verdact uses Petra for wallet identity, Shelby uploads, subscriptions, and donations.
                </p>
              </div>
              <button type="button" onClick={() => setShowInstall(false)} className="interactive-control inline-flex h-9 w-9 shrink-0 items-center justify-center border border-base" aria-label="Close install Petra dialog">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <a href="https://petra.app/" target="_blank" rel="noreferrer" className="interactive-control inline-flex min-h-11 items-center justify-center gap-2 bg-brand px-4 font-mono text-sm text-brand-dark">
                Install Petra
                <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" onClick={() => setShowInstall(false)} className="interactive-control min-h-10 border border-base px-4 font-mono text-xs text-text-primary">
                I installed it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
