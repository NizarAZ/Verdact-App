const shelbyExplorerBase = "https://explorer.shelbynet.shelby.xyz";

export function getShelbyTxnUrl(txHash?: string | null) {
  return txHash ? `${shelbyExplorerBase}/txn/${encodeURIComponent(txHash)}` : "";
}

export function getShelbyBlobUrl(blobName?: string | null) {
  return blobName ? `${shelbyExplorerBase}/blob/${encodeURIComponent(blobName)}` : "";
}

export function getShelbyAccountBlobsUrl(accountAddress: string) {
  return `${shelbyExplorerBase}/account/${encodeURIComponent(accountAddress)}/blobs`;
}
