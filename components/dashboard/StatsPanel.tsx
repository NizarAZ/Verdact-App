"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { animate } from "framer-motion";
import { useWallet } from "@/components/WalletProvider";

type StatsResponse = {
  documents: number;
  chunks: number;
  receipts: number;
  onchainRegistrations?: number;
  lastActivityAt?: string | null;
  lastActivityMicros: number | null;
};

const emptyStats: StatsResponse = {
  documents: 0,
  chunks: 0,
  receipts: 0,
  lastActivityMicros: null
};

function timeAgo(dateString?: string | null) {
  if (!dateString) return "never";

  const date = new Date(dateString);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return "never";

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function useCountUp(value: number, ready: boolean) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!ready || value === 0) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(0, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });

    return () => controls.stop();
  }, [ready, value]);

  return displayValue;
}

function MetricNumber({ value, loading }: { value: number; loading: boolean }) {
  const count = useCountUp(value, !loading);

  if (loading) {
    return <span className="stats-skeleton block h-6 w-14 rounded-sm" />;
  }

  return <span className="font-mono text-[22px] font-medium leading-none text-text-primary">{count}</span>;
}

export function StatsPanel() {
  const { address, walletFetch } = useWallet();
  const [stats, setStats] = useState<StatsResponse>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      // Guard: don't fetch until wallet is connected
      if (!address) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const response = await walletFetch("/api/stats", { cache: "no-store" });
        const payload = (await response.json()) as StatsResponse;
        if (mounted) setStats({ ...emptyStats, ...payload });
      } catch {
        if (mounted) setStats(emptyStats);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();

    // Timeout fallback: force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [address, walletFetch]);

  const lastActivity = useMemo(() => timeAgo(stats.lastActivityAt), [stats.lastActivityAt]);
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet";

  async function copyAccount() {
    if (!address) return;

    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const statItems = [
    { label: "Onchain registrations", value: <MetricNumber value={stats.onchainRegistrations ?? stats.documents} loading={loading} /> },
    { label: "Chunks indexed", value: <MetricNumber value={stats.chunks} loading={loading} /> },
    { label: "Receipts", value: <MetricNumber value={stats.receipts} loading={loading} /> },
    {
      label: "Last activity",
      value: loading ? (
        <span className="stats-skeleton block h-6 w-16 rounded-sm" />
      ) : (
        <span className="font-mono text-[22px] font-medium leading-none text-text-primary">{lastActivity}</span>
      )
    }
  ];

  return (
    <section className="rounded-[var(--radius-md)] border border-base bg-[color:var(--color-surface)]">
      <div className="flex flex-col divide-y divide-base lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
        {statItems.map((item) => (
          <div key={item.label} className="min-w-0 flex-1 px-5 py-4">
            <p className="font-body text-[11px] text-text-tertiary">{item.label}</p>
            <div className="mt-2">{item.value}</div>
          </div>
        ))}

        <button
          type="button"
          onClick={copyAccount}
          disabled={!address}
          className="flex min-w-[190px] items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 ease-in hover:bg-white/[0.035] disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="min-w-0">
            <span className="block font-body text-[11px] text-text-tertiary">Wallet</span>
            <span className="mt-2 block truncate font-mono text-[15px] text-text-primary">{displayAddress}</span>
          </span>
          {copied ? <Check className="h-4 w-4 shrink-0 text-[var(--success)]" /> : <Copy className="h-4 w-4 shrink-0 text-text-tertiary" />}
        </button>
      </div>
    </section>
  );
}
