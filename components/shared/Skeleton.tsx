"use client";

import type { ReactNode } from "react";

export function Skeleton({
  width = "100%",
  height = 20,
  className = ""
}: {
  width?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`verdact-skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ConnectPrompt({ title = "Connect your Petra Wallet to continue", body = "Switch to Shelbynet and connect to access this page.", children }: { title?: string; body?: string; children: ReactNode }) {
  return (
    <div className="connect-prompt vault-empty max-w-3xl p-8">
      <h1 className="font-display text-6xl leading-none text-text-primary">{title}</h1>
      <p className="mt-4 max-w-lg text-sm leading-6 text-text-tertiary">{body}</p>
      <div className="relative z-10 mt-6">{children}</div>
    </div>
  );
}
