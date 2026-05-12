"use client";

import { CSSProperties, useEffect, useState } from "react";

type NetworkStatus = "online" | "slow" | "down";

const statusCopy: Record<NetworkStatus, string> = {
  online: "shelbynet",
  slow: "shelbynet",
  down: "shelbynet"
};

const statusColor: Record<NetworkStatus, string> = {
  online: "var(--success)",
  slow: "var(--warning)",
  down: "var(--danger)"
};

export function ShelbynetStatus() {
  const [status, setStatus] = useState<NetworkStatus>("down");

  useEffect(() => {
    let mounted = true;

    async function checkShelbynet() {
      const startedAt = performance.now();
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3000);

      try {
        await fetch("https://api.shelbynet.shelby.xyz/v1", {
          cache: "no-store",
          mode: "no-cors",
          signal: controller.signal
        });

        if (!mounted) return;

        const elapsed = performance.now() - startedAt;
        setStatus(elapsed > 1500 ? "slow" : "online");
      } catch {
        if (mounted) setStatus("down");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    checkShelbynet();
    const interval = window.setInterval(checkShelbynet, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary" aria-label={`Shelbynet status: ${status}`}>
      <span
        className="shelbynet-status-dot relative h-2 w-2 rounded-full"
        data-status={status}
        style={{ "--status-color": statusColor[status] } as CSSProperties}
      />
      <span>{statusCopy[status]}</span>
    </div>
  );
}
