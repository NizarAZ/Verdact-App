const shelbyExplorerBase = "https://explorer.shelby.xyz";
const aptosExplorerTxnBase = "https://explorer.aptoslabs.com/txn";

export function getShelbyTxnUrl(txHash?: string | null) {
  return txHash ? `${aptosExplorerTxnBase}/${encodeURIComponent(txHash)}?network=shelbynet` : "";
}

export function getShelbyBlobUrl(accountAddress?: string | null, blobName?: string | null) {
  if (!accountAddress) return "";
  const base = `${shelbyExplorerBase}/shelbynet/account/${encodeURIComponent(accountAddress)}/blobs`;
  return blobName ? `${base}?name=${encodeURIComponent(blobName)}` : base;
}

export function getShelbyAccountBlobsUrl(accountAddress: string) {
  return `${shelbyExplorerBase}/shelbynet/account/${encodeURIComponent(accountAddress)}/blobs`;
}
