"use client";

import { useWallet } from "@/components/WalletProvider";

function isShelbynet(network?: string | null) {
  return Boolean(network && /shelby/i.test(network));
}

export function NetworkBadge() {
  const { isConnected, network } = useWallet();
  const label = isConnected ? network || "Unknown network" : "Not connected";
  const ok = isShelbynet(network);

  return (
    <span className={`network-badge ${ok ? "active" : "wrong-network"}`} title={ok ? "Connected to Shelbynet" : "Switch to Shelbynet to transact"}>
      <span aria-hidden="true">●</span> {label}
    </span>
  );
}
