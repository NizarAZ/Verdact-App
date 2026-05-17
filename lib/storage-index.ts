import type { AnswerReceiptRecord, DocumentRecord } from "@/lib/supabase-server";
import { listReceiptBlobs, loadReceiptFromBlob } from "@/lib/receipts";
import { downloadBlobText, getAccountBlobs } from "@/lib/shelby-server";
import { workspaceBlobPrefix } from "@/lib/workspace";

type StoredDocumentMeta = {
  document_id?: string;
  wallet_address?: string;
  title?: string;
  file_name?: string;
  size?: number;
  file_hash?: string;
  chunk_count?: number;
  blob_id?: string;
  onchain_tx_hash?: string;
  created_at?: string;
};

function sortByNewest<T extends { created_at?: string | null; creationMicros?: number | string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : Number(a.creationMicros ?? 0) / 1000;
    const bTime = b.created_at ? Date.parse(b.created_at) : Number(b.creationMicros ?? 0) / 1000;
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

export async function listDocumentRecordsFromShelby(workspaceId: string, walletAddress: string, limit: number) {
  const prefix = workspaceBlobPrefix(workspaceId, "documents");
  const blobs = (await getAccountBlobs()).filter((blob) => blob.name.startsWith(prefix) && blob.name.endsWith("/meta.json"));
  const documents: (DocumentRecord & { creationMicros?: number | string | null })[] = [];

  for (const blob of blobs) {
    try {
      const text = await downloadBlobText(blob.name);
      if (!text) continue;

      const parsed = JSON.parse(text) as StoredDocumentMeta;
      if (parsed.wallet_address !== walletAddress || !parsed.document_id || !parsed.blob_id || !parsed.onchain_tx_hash || !parsed.file_hash || !parsed.file_name) {
        continue;
      }

      documents.push({
        id: parsed.document_id,
        wallet_address: parsed.wallet_address,
        file_name: parsed.file_name,
        title: parsed.title ?? parsed.file_name,
        onchain_tx_hash: parsed.onchain_tx_hash,
        blob_id: parsed.blob_id,
        file_hash: parsed.file_hash,
        chunk_count: parsed.chunk_count ?? 0,
        size: parsed.size ?? null,
        created_at: parsed.created_at ?? null,
        creationMicros: blob.creationMicros
      });
    } catch {
      continue;
    }
  }

  return sortByNewest(documents).slice(0, limit);
}

export async function getDocumentRecordFromShelby(workspaceId: string, walletAddress: string, documentId: string) {
  const documents = await listDocumentRecordsFromShelby(workspaceId, walletAddress, 250);
  return documents.find((document) => document.id === documentId) ?? null;
}

export async function getDocumentByTxHashFromShelby(workspaceId: string, txHash: string) {
  const prefix = workspaceBlobPrefix(workspaceId, "documents");
  const blobs = (await getAccountBlobs()).filter((blob) => blob.name.startsWith(prefix) && blob.name.endsWith("/meta.json"));

  for (const blob of blobs) {
    try {
      const text = await downloadBlobText(blob.name);
      if (!text) continue;

      const parsed = JSON.parse(text) as StoredDocumentMeta;
      if (parsed.onchain_tx_hash !== txHash || !parsed.document_id || !parsed.wallet_address || !parsed.blob_id || !parsed.file_hash || !parsed.file_name) {
        continue;
      }

      return {
        id: parsed.document_id,
        wallet_address: parsed.wallet_address,
        file_name: parsed.file_name,
        title: parsed.title ?? parsed.file_name,
        onchain_tx_hash: parsed.onchain_tx_hash,
        blob_id: parsed.blob_id,
        file_hash: parsed.file_hash,
        chunk_count: parsed.chunk_count ?? 0,
        size: parsed.size ?? null,
        created_at: parsed.created_at ?? null
      } satisfies DocumentRecord;
    } catch {
      continue;
    }
  }

  return null;
}

export async function listAnswerReceiptRecordsFromShelby(workspaceId: string, walletAddress: string | null, limit: number) {
  const receipts = await Promise.all(
    (await listReceiptBlobs(workspaceId, Math.max(limit * 3, limit))).map((blob) => loadReceiptFromBlob(blob.name, blob.creationMicros))
  );

  return sortByNewest(
    receipts
      .filter((receipt): receipt is NonNullable<typeof receipt> => Boolean(receipt))
      .filter((receipt) => !walletAddress || receipt.wallet_address === walletAddress)
      .map((receipt) => ({
        id: receipt.receipt_id,
        wallet_address: receipt.wallet_address ?? "",
        query: receipt.question,
        answer: receipt.answer,
        receipt_hash: (receipt as { receipt_hash?: string }).receipt_hash ?? receipt.context_hash,
        onchain_tx_hash: (receipt as { onchain_tx_hash?: string }).onchain_tx_hash ?? "",
        blob_ids_used: receipt.sources.map((source) => source.source_blob ?? source.chunk_blob),
        receipt_blob_id: receipt.shelby_receipt_blob,
        created_at: receipt.timestamp ? new Date(receipt.timestamp).toISOString() : null,
        creationMicros: receipt.creationMicros
      }))
  ).slice(0, limit) as (AnswerReceiptRecord & { creationMicros?: number | string | null })[];
}

export async function getReceiptByTxHashFromShelby(workspaceId: string, txHash: string) {
  const receipts = await listAnswerReceiptRecordsFromShelby(workspaceId, null, 250);
  return receipts.find((receipt) => receipt.onchain_tx_hash === txHash) ?? null;
}
