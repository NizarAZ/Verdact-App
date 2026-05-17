import { AccountAddress } from "@aptos-labs/ts-sdk";
import { ShelbyBlobClient, createDefaultErasureCodingProvider, generateCommitments } from "@shelby-protocol/sdk/node";

export const shelbyExplorerBaseUrl = "https://explorer.aptoslabs.com/txn";

export function getFullnodeUrl() {
  return process.env.NEXT_PUBLIC_SHELBY_FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1";
}

export function getExplorerUrl(txHash: string) {
  return `${shelbyExplorerBaseUrl}/${encodeURIComponent(txHash)}?network=shelbynet`;
}

export function getContractAddress() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
  }

  return contractAddress;
}

export async function createBlobRegistrationPayload(params: {
  walletAddress: string;
  blobName: string;
  blobData: Uint8Array;
  expirationMicros: number;
}) {
  const provider = await createDefaultErasureCodingProvider();
  const commitments = await generateCommitments(provider, params.blobData);

  return {
    payload: ShelbyBlobClient.createRegisterBlobPayload({
      deployer: AccountAddress.from(getContractAddress()),
      account: AccountAddress.from(params.walletAddress),
      blobName: params.blobName,
      blobSize: params.blobData.length,
      blobMerkleRoot: commitments.blob_merkle_root,
      expirationMicros: params.expirationMicros,
      numChunksets: commitments.chunkset_commitments.length,
      encoding: provider.config.enumIndex
    }),
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: commitments.chunkset_commitments.length
  };
}

export function toSerializableTransactionPayload<T>(value: T): T {
  if (value instanceof Uint8Array) {
    return Array.from(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializableTransactionPayload(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toSerializableTransactionPayload(entry)])
    ) as T;
  }

  return value;
}


export async function fetchTransaction(txHash: string) {
  const response = await fetch(`${getFullnodeUrl()}/transactions/by_hash/${encodeURIComponent(txHash)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Transaction not found on Shelbynet.");
  }

  return response.json();
}

export async function waitForTransaction(txHash: string, timeoutMs = 45_000) {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await fetchTransaction(txHash);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Transaction was not found on Shelbynet in time.");
}
