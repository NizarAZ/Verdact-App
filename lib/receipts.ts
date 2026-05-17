import { sha256Hex } from "@/lib/document-processing";
import { downloadBlobText, getAccountBlobs } from "@/lib/shelby-server";
import { workspaceBlobPrefix } from "@/lib/workspace";

export type AnswerSource = {
  document_id?: string;
  chunk_index?: number;
  text: string;
  context_hash: string;
  source_blob?: string;
  chunk_blob: string;
};

export type AnswerReceipt = {
  receipt_id: string;
  wallet_address?: string;
  question: string;
  answer: string;
  model: string;
  timestamp: number;
  sources: AnswerSource[];
  total_chunks_retrieved: number;
  context_hash: string;
  shelby_receipt_blob: string;
  verified: boolean;
  blobName?: string;
  creationMicros?: number | string | null;
};

function toMicros(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function computeContextHash(sources: Pick<AnswerSource, "context_hash" | "chunk_blob">[]) {
  const stable = sources
    .map((source) => `${source.chunk_blob}:${source.context_hash}`)
    .sort()
    .join("|");

  return sha256Hex(stable);
}

export async function computeReceiptIntegrityHash(query: string, answer: string, blobIds: string[]) {
  return sha256Hex(`${query}${answer}${blobIds.join(",")}`);
}

export async function listReceiptBlobs(workspaceId: string, limit = 25) {
  const receiptsPrefix = workspaceBlobPrefix(workspaceId, "receipts");

  return (await getAccountBlobs())
    .filter((blob) => blob.name.startsWith(receiptsPrefix))
    .sort((a, b) => (toMicros(b.creationMicros) ?? 0) - (toMicros(a.creationMicros) ?? 0))
    .slice(0, limit);
}

export async function loadReceiptFromBlob(blobName: string, creationMicros?: number | string | null) {
  const text = await downloadBlobText(blobName);
  if (!text) return null;

  const parsed = JSON.parse(text) as AnswerReceipt;

  return {
    ...parsed,
    blobName,
    creationMicros
  };
}

export async function findReceipt(workspaceId: string, idOrBlob: string) {
  const decoded = decodeURIComponent(idOrBlob);
  const receiptBlobs = await listReceiptBlobs(workspaceId, 100);

  for (const blob of receiptBlobs) {
    if (blob.name === decoded) {
      return loadReceiptFromBlob(blob.name, blob.creationMicros);
    }
  }

  for (const blob of receiptBlobs) {
    const receipt = await loadReceiptFromBlob(blob.name, blob.creationMicros);
    if (!receipt) continue;

    if (receipt.receipt_id === decoded || receipt.shelby_receipt_blob === decoded || receipt.blobName === decoded) {
      return receipt;
    }
  }

  return null;
}
