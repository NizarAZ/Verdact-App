import { NextRequest, NextResponse } from "next/server";
import { listAnswerReceiptRecords, type AnswerReceiptRecord } from "@/lib/supabase-server";
import { getWalletAddress } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "3");
  if (!Number.isFinite(raw)) return 3;
  return Math.max(1, Math.min(Math.floor(raw), 25));
}

function receiptTime(receipt: AnswerReceiptRecord) {
  const parsed = receipt.created_at ? Date.parse(receipt.created_at) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function serializeReceipt(receipt: AnswerReceiptRecord) {
  const blobIdsUsed = Array.isArray(receipt.blob_ids_used) ? receipt.blob_ids_used : [];

  return {
    receipt_id: receipt.id ?? receipt.receipt_hash,
    id: receipt.id,
    question: receipt.query,
    answer: receipt.answer,
    receipt_hash: receipt.receipt_hash,
    onchain_tx_hash: receipt.onchain_tx_hash,
    sources: blobIdsUsed.map((blobId) => ({ chunk_blob: blobId })),
    total_chunks_retrieved: blobIdsUsed.length,
    context_hash: receipt.receipt_hash,
    verified: Boolean(receipt.receipt_hash),
    blobName: receipt.receipt_blob_id,
    created_at: receipt.created_at
  };
}

export async function GET(request: NextRequest) {
  const limit = readLimit(request);

  try {
    const walletAddress = getWalletAddress(request);
    const receipts = await listAnswerReceiptRecords(walletAddress, limit);

    return NextResponse.json(
      [...receipts]
        .sort((a, b) => receiptTime(b) - receiptTime(a))
        .slice(0, limit)
        .map(serializeReceipt)
    );
  } catch (error) {
    console.error("Failed to load receipts", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json([]);
  }
}
