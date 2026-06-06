"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { truncateMiddle } from "@/lib/format";

export function WalletAddress({
  address,
  start = 6,
  end = 4,
  className = ""
}: {
  address?: string | null;
  start?: number;
  end?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!address) return null;

  function copy() {
    void navigator.clipboard.writeText(address as string);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <code className="min-w-0 truncate font-mono text-xs">{truncateMiddle(address, start, end)}</code>
      <button
        type="button"
        onClick={copy}
        className="interactive-control inline-flex h-7 w-7 shrink-0 items-center justify-center border border-base"
        aria-label={copied ? "Wallet address copied" : "Copy wallet address"}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}
