import Link from "next/link";
import { ShelbyLogo } from "@/components/shelby-logo";
import { ShelbynetStatus } from "@/components/shared/ShelbynetStatus";
import { AppAuthGate } from "@/components/wallet/AppAuthGate";
import { WalletButton } from "@/components/wallet/WalletButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-dashboard min-h-screen">
      <header className="border-b border-base">
        <div className="mx-auto flex min-h-20 w-full max-w-[1100px] items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md transition-opacity duration-150 ease-in hover:opacity-80"
            aria-label="Go to Verdact landing page"
          >
            <ShelbyLogo className="h-10 w-10" />
            <div>
              <p className="font-display text-xl font-bold text-text-primary">Verdact App</p>
              <p className="font-mono text-xs text-text-tertiary">built on Shelby / shelbynet</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <ShelbynetStatus />
            <WalletButton compact />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-8">
        <AppAuthGate>{children}</AppAuthGate>
      </div>
    </main>
  );
}
