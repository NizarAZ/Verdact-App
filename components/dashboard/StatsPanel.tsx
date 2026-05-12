"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StatsResponse = {
  documents: number;
  chunks: number;
  receipts: number;
  lastActivityMicros: number | null;
  accountAddress: string | null;
};

const emptyStats: StatsResponse = {
  documents: 0,
  chunks: 0,
  receipts: 0,
  lastActivityMicros: null,
  accountAddress: null
};

function relativeTimeFromMicros(micros: number | null) {
  if (!micros) return "never";

  const elapsed = Date.now() - Math.floor(micros / 1000);
  const seconds = Math.max(0, Math.floor(elapsed / 1000));

  if (seconds < 45) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateAddress(address: string | null) {
  if (!address) return "not configured";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function useCountUp(value: number, ready: boolean) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!ready || value === 0) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 800;

    const tick = (time: number) => {
      const progress = Math.min((time - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [ready, value]);

  return displayValue;
}

function MetricNumber({ value, loading }: { value: number; loading: boolean }) {
  const count = useCountUp(value, !loading);

  if (loading) {
    return <span className="stats-skeleton block h-9 w-20 rounded-sm" />;
  }

  return <span className="font-mono text-[28px] font-medium leading-none text-text-primary">{count}</span>;
}

export function StatsPanel() {
  const [stats, setStats] = useState<StatsResponse>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        const payload = (await response.json()) as StatsResponse;
        if (mounted) setStats({ ...emptyStats, ...payload });
      } catch {
        if (mounted) setStats(emptyStats);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const allZero = !loading && stats.documents === 0 && stats.chunks === 0 && stats.receipts === 0;
  const lastActivity = useMemo(() => relativeTimeFromMicros(stats.lastActivityMicros), [stats.lastActivityMicros]);

  async function copyAccount() {
    if (!stats.accountAddress) return;

    await navigator.clipboard.writeText(stats.accountAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="min-h-[280px] rounded-[var(--radius-lg)] border border-base bg-bg-surface">
      {allZero ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
          <p className="font-display text-2xl text-text-primary">No documents yet.</p>
          <p className="mt-2 font-body text-sm text-text-tertiary">Upload your first document to begin.</p>
          <Link
            href="/app/upload"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-brand px-4 font-mono text-sm font-medium text-brand-dark"
          >
            Upload document
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          <div className="border-b border-r border-base p-8">
            <p className="font-body text-xs text-text-tertiary">Documents</p>
            <div className="mt-3">
              <MetricNumber value={stats.documents} loading={loading} />
            </div>
          </div>
          <div className="border-b border-base p-8">
            <p className="font-body text-xs text-text-tertiary">Chunks indexed</p>
            <div className="mt-3">
              <MetricNumber value={stats.chunks} loading={loading} />
            </div>
          </div>
          <div className="border-r border-base p-8">
            <p className="font-body text-xs text-text-tertiary">Receipts</p>
            <div className="mt-3">
              <MetricNumber value={stats.receipts} loading={loading} />
            </div>
          </div>
          <div className="p-8">
            <p className="font-body text-xs text-text-tertiary">Last activity</p>
            <div className="mt-3">
              {loading ? (
                <span className="stats-skeleton block h-9 w-24 rounded-sm" />
              ) : (
                <span className="font-mono text-[28px] font-medium leading-none text-text-primary">{lastActivity}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={copyAccount}
        disabled={!stats.accountAddress}
        className="flex w-full items-center justify-between border-t border-base p-8 text-left transition-colors duration-150 ease-in hover:bg-bg-elevated disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span>
          <span className="block font-mono text-[11px] text-text-tertiary">account</span>
          <span className="mt-1 block font-mono text-xs text-text-secondary">{truncateAddress(stats.accountAddress)}</span>
        </span>
        {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4 text-text-tertiary" />}
      </button>
    </section>
  );
}
