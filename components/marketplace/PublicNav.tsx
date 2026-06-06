"use client";

import Link from "next/link";
import { ShelbyLogo } from "@/components/shelby-logo";
import { WalletButton } from "@/components/wallet/WalletButton";
import { NetworkBadge } from "@/components/shared/NetworkBadge";

export function PublicNav() {
  return (
    <header className="public-nav-shell">
      <nav className="container-shell flex items-center justify-between gap-4">
        <Link href="/" prefetch={false} className="interactive-control flex items-center gap-3">
          <ShelbyLogo className="h-10 w-10" />
          <span className="font-display text-3xl">Verdact</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" prefetch={false} className="interactive-control hidden font-mono text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] sm:inline">
            Marketplace
          </Link>
          <Link href="/profile" className="interactive-control hidden font-mono text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] md:inline">
            Profile
          </Link>
          <Link href="/vault" className="interactive-control hidden font-mono text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] sm:inline">
            Creator vault
          </Link>
          <NetworkBadge />
          <WalletButton compact />
        </div>
      </nav>
    </header>
  );
}
