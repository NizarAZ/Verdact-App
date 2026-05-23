"use client";

import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import {
  ShelbyBlobClient,
  ShelbyClient,
  SHELBYUSD_FA_METADATA_ADDRESS,
  createDefaultErasureCodingProvider,
  generateCommitments
} from "@shelby-protocol/sdk/browser";

export const shelbyUsdMetadataAddress = SHELBYUSD_FA_METADATA_ADDRESS;

function getContractAddress() {
  const value = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!value) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
  return value;
}

export function getShelbyBrowserClient() {
  const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY;
  return new ShelbyClient({
    network: Network.SHELBYNET,
    apiKey,
    rpc: {
      baseUrl: process.env.NEXT_PUBLIC_SHELBY_RPC_URL || "https://api.shelbynet.shelby.xyz/shelby",
      apiKey
    }
  });
}

function toSerializable<T>(value: T): T {
  if (value instanceof Uint8Array) return Array.from(value) as T;
  if (typeof value === "bigint") return value.toString() as T;
  if (Array.isArray(value)) return value.map((item) => toSerializable(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toSerializable(entry)])
    ) as T;
  }
  return value;
}

export async function createClientBlobRegistration(params: {
  walletAddress: string;
  blobName: string;
  blobData: Uint8Array;
  expirationMicros: number;
}) {
  const provider = await createDefaultErasureCodingProvider();
  const commitments = await generateCommitments(provider, params.blobData);
  const payload = ShelbyBlobClient.createRegisterBlobPayload({
    deployer: AccountAddress.from(getContractAddress()),
    account: AccountAddress.from(params.walletAddress),
    blobName: params.blobName,
    blobSize: params.blobData.length,
    blobMerkleRoot: commitments.blob_merkle_root,
    expirationMicros: params.expirationMicros,
    numChunksets: commitments.chunkset_commitments.length,
    encoding: provider.config.enumIndex
  });

  return toSerializable(payload);
}

export async function putShelbyBlob(params: {
  walletAddress: string;
  blobName: string;
  blobData: Uint8Array;
  onProgress?: (progress: { phase: string; uploadedBytes: number; totalBytes: number }) => void;
}) {
  const client = getShelbyBrowserClient();
  await client.rpc.putBlob({
    account: AccountAddress.from(params.walletAddress),
    blobName: params.blobName,
    blobData: params.blobData,
    onProgress: params.onProgress
  });
}

export async function putShelbyBlobViaServer(params: {
  blobName: string;
  file: File;
  walletFetch: typeof fetch;
}) {
  const form = new FormData();
  form.set("blobName", params.blobName);
  form.set("file", params.file);
  const response = await params.walletFetch("/api/shelby/upload", {
    method: "POST",
    body: form
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Shelby upload failed.");
}

export async function readShelbyBlob(params: {
  walletAddress: string;
  blobName: string;
}) {
  const client = getShelbyBrowserClient();
  const blob = await client.download({
    account: AccountAddress.from(params.walletAddress),
    blobName: params.blobName
  });
  const response = new Response(blob.readable);
  return new Uint8Array(await response.arrayBuffer());
}

export function createShelbyUsdTransferPayload(params: {
  creatorWallet: string;
  amountMicroUnits: string;
}) {
  return {
    function: "0x1::primary_fungible_store::transfer",
    typeArguments: ["0x1::object::ObjectCore"],
    functionArguments: [SHELBYUSD_FA_METADATA_ADDRESS, params.creatorWallet, params.amountMicroUnits]
  };
}

export function createBlobObjectUrl(bytes: Uint8Array, fileType?: string | null) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return URL.createObjectURL(new Blob([buffer], { type: fileType || "application/octet-stream" }));
}
