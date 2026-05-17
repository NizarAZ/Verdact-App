import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { AnswerReceiptRecord, DocumentRecord } from "@/lib/supabase-server";
import type { AnswerSource } from "@/lib/receipts";

type LocalChunk = AnswerSource & {
  document_id: string;
  wallet_address: string;
  embedding?: number[];
  created_at?: string;
};

type LocalIndex = {
  documents: DocumentRecord[];
  chunks: LocalChunk[];
  receipts: (AnswerReceiptRecord & { id: string })[];
};

function indexPath(workspaceId: string) {
  const safeWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(process.cwd(), ".verdact-index", safeWorkspace, "index.json");
}

function indexRoot() {
  return path.join(process.cwd(), ".verdact-index");
}

async function readIndex(workspaceId: string): Promise<LocalIndex> {
  try {
    const raw = await readFile(indexPath(workspaceId), "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalIndex>;

    return {
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [],
      receipts: Array.isArray(parsed.receipts) ? parsed.receipts : []
    };
  } catch {
    return { documents: [], chunks: [], receipts: [] };
  }
}

async function writeIndex(workspaceId: string, index: LocalIndex) {
  const filePath = indexPath(workspaceId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(index, null, 2), "utf8");
}

export async function saveLocalDocumentRecord(workspaceId: string, record: DocumentRecord) {
  const index = await readIndex(workspaceId);
  index.documents = [record, ...index.documents.filter((document) => document.id !== record.id)];
  await writeIndex(workspaceId, index);
}

export async function listLocalDocumentRecords(workspaceId: string, walletAddress: string, limit: number) {
  const index = await readIndex(workspaceId);

  return index.documents
    .filter((document) => document.wallet_address === walletAddress)
    .sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""))
    .slice(0, limit);
}

export async function getLocalDocumentRecord(workspaceId: string, walletAddress: string, documentId: string) {
  const index = await readIndex(workspaceId);
  return index.documents.find((document) => document.wallet_address === walletAddress && document.id === documentId) ?? null;
}

export async function saveLocalChunks(workspaceId: string, documentId: string, chunks: LocalChunk[]) {
  const index = await readIndex(workspaceId);
  index.chunks = [...index.chunks.filter((chunk) => chunk.document_id !== documentId), ...chunks];
  await writeIndex(workspaceId, index);
}

export async function listLocalChunks(workspaceId: string, walletAddress: string, documentId: string) {
  const index = await readIndex(workspaceId);
  return index.chunks.filter((chunk) => chunk.wallet_address === walletAddress && chunk.document_id === documentId);
}

export async function saveLocalAnswerReceipt(workspaceId: string, receipt: AnswerReceiptRecord & { id: string }) {
  const index = await readIndex(workspaceId);
  index.receipts = [receipt, ...index.receipts.filter((item) => item.id !== receipt.id)];
  await writeIndex(workspaceId, index);
}

export async function listLocalAnswerReceipts(workspaceId: string, walletAddress: string, limit: number) {
  const index = await readIndex(workspaceId);

  return index.receipts
    .filter((receipt) => receipt.wallet_address === walletAddress)
    .sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""))
    .slice(0, limit);
}

export async function getLocalAnswerReceipt(workspaceId: string, id: string) {
  const index = await readIndex(workspaceId);
  return index.receipts.find((receipt) => receipt.id === id) ?? null;
}

export async function findLocalAnswerReceipt(id: string) {
  try {
    const entries = await readdir(indexRoot(), { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const receipt = await getLocalAnswerReceipt(entry.name, id);
      if (receipt) return receipt;
    }
  } catch {
    return null;
  }

  return null;
}
