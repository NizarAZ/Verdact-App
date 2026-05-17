import { NextResponse } from "next/server";
import { listDocumentRecordsFromShelby } from "@/lib/storage-index";
import { listAnswerReceiptRecords, listDocumentRecords, type DocumentRecord } from "@/lib/supabase-server";
import { getWalletAddress, getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function latestActivityIso(values: (string | null | undefined)[]) {
  const timestamps = values
    .map((value) => {
      if (!value) return null;
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((value): value is number => value !== null);

  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function dedupeDocuments(documents: DocumentRecord[]) {
  const seen = new Set<string>();

  return documents.filter((document) => {
    const key = document.file_hash || document.id || document.blob_id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const workspaceId = await getWorkspaceId(request);
    const [supabaseDocumentsResult, shelbyDocumentsResult, receiptsResult] = await Promise.allSettled([
      listDocumentRecords(walletAddress, 500),
      listDocumentRecordsFromShelby(workspaceId, walletAddress, 500),
      listAnswerReceiptRecords(walletAddress, 500)
    ]);

    if (supabaseDocumentsResult.status === "rejected") {
      console.error("Failed to load Supabase stats documents", supabaseDocumentsResult.reason);
    }

    if (shelbyDocumentsResult.status === "rejected") {
      console.error("Failed to load Shelby stats documents", shelbyDocumentsResult.reason);
    }

    if (receiptsResult.status === "rejected") {
      console.error("Failed to load stats receipts", receiptsResult.reason);
    }

    const documents = dedupeDocuments([
      ...(supabaseDocumentsResult.status === "fulfilled" ? supabaseDocumentsResult.value : []),
      ...(shelbyDocumentsResult.status === "fulfilled" ? shelbyDocumentsResult.value : [])
    ]);
    const receipts = receiptsResult.status === "fulfilled" ? receiptsResult.value : [];
    const chunks = documents.reduce((total, document) => total + (document.chunk_count ?? 0), 0);
    const lastActivityAt = latestActivityIso([
      ...documents.map((item) => item.created_at),
      ...receipts.map((item) => item.created_at)
    ]);

    return NextResponse.json({
      documents: documents.length,
      chunks,
      receipts: receipts.length,
      onchainRegistrations: documents.length,
      lastActivityAt,
      lastActivityMicros: lastActivityAt ? Date.parse(lastActivityAt) * 1000 : null,
      workspaceId
    });
  } catch (error) {
    console.error("Failed to load stats", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      documents: 0,
      chunks: 0,
      receipts: 0,
      onchainRegistrations: 0,
      lastActivityAt: null,
      lastActivityMicros: null
    });
  }
}
