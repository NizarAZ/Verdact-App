"use client";

export async function waitForShelbynetTransaction(txHash: string) {
  const fullnodeUrl = process.env.NEXT_PUBLIC_SHELBY_FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1";
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const response = await fetch(`${fullnodeUrl}/transactions/by_hash/${encodeURIComponent(txHash)}`, {
      cache: "no-store"
    });

    if (response.ok) {
      const tx = await response.json();
      if (tx?.success === false) throw new Error(tx?.vm_status || "Onchain transaction failed.");
      return tx;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  throw new Error("Timed out waiting for Shelbynet confirmation.");
}
