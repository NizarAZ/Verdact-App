"use client";

import { useRef, useState } from "react";
import { ExternalLink, LogOut, Wallet, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useWallet } from "@/components/WalletProvider";
import { normalizeWalletAddress } from "@/lib/wallet";

gsap.registerPlugin(useGSAP);

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { account, connect, disconnect, isConnected } = useWallet();
  const [pending, setPending] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [error, setError] = useState("");
  const installPanelRef = useRef<HTMLDivElement | null>(null);
  const address = normalizeWalletAddress(account?.address?.toString());

  useGSAP(() => {
    if (!showInstall || !installPanelRef.current) return;
    gsap.fromTo(
      installPanelRef.current,
      { autoAlpha: 0, y: -10 },
      { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" }
    );
  }, { dependencies: [showInstall], scope: installPanelRef });

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

  async function handleInstalledCheck() {
    if (typeof window !== "undefined" && !("petra" in window)) {
      setError("Petra was not detected yet. Refresh after installing the extension.");
      return;
    }
    setShowInstall(false);
    await handleConnect();
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
        <div className="fixed right-4 top-20 z-[90] w-[calc(100vw-2rem)] max-w-sm md:right-8">
          <div ref={installPanelRef} className="border border-base bg-[color:var(--color-bg)] p-4 shadow-[0_10px_30px_rgba(70,49,18,0.16)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-base bg-brand text-brand-dark">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-3xl leading-none text-text-primary">Petra is required</h2>
                  <button type="button" onClick={() => setShowInstall(false)} className="interactive-control inline-flex h-8 w-8 shrink-0 items-center justify-center border border-base" aria-label="Close install Petra dialog">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-tertiary">
                  Install Petra, then return here to connect your wallet.
                </p>
                {error ? <p className="mt-2 font-mono text-xs text-brand">{error}</p> : null}
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <a href="https://petra.app/" target="_blank" rel="noreferrer" className="interactive-control inline-flex min-h-11 items-center justify-center gap-2 bg-brand px-4 font-mono text-sm text-brand-dark">
                Install Petra
                <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" onClick={handleInstalledCheck} className="interactive-control min-h-10 border border-base px-4 font-mono text-xs text-text-primary">
                I installed it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
