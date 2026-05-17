export function getShelbyAccountBlobsUrl(accountAddress: string) {
  return `https://explorer.shelby.xyz/shelbynet/account/${encodeURIComponent(accountAddress)}/blobs`;
}

export function getShelbyBlobUrl(accountAddress: string, blobName: string) {
  return `https://explorer.shelby.xyz/shelbynet/account/${encodeURIComponent(accountAddress)}/blob/${encodeURIComponent(blobName)}`;
}
