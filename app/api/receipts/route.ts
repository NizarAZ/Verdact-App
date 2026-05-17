import { NextRequest, NextResponse } from "next/server";
import { listAnswerReceiptRecords } from "@/lib/supabase-server";
import { getWalletAddress } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "3");
  if (!Number.isFinite(raw)) return 3;
  return Math.max(1, Math.min(Math.floor(raw), 25));
}

export async function GET(request: NextRequest) {
  try {
    const walletAddress = getWalletAddress(request);
    const receipts = await listAnswerReceiptRecords(walletAddress, readLimit(request));

    return NextResponse.json(
      receipts.map((receipt) => ({
        receipt_id: receipt.id ?? receipt.receipt_hash,
        question: receipt.query,
        answer: receipt.answer,
        receipt_hash: receipt.receipt_hash,
        onchain_tx_hash: receipt.onchain_tx_hash,
        sources: receipt.blob_ids_used.map((blobId) => ({ chunk_blob: blobId })),
        context_hash: receipt.receipt_hash,
        verified: Boolean(receipt.receipt_hash),
        blobName: receipt.receipt_blob_id,
        created_at: receipt.created_at
      }))
    );
  } catch (error) {
    console.error("Failed to load receipts", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json([]);
  }
}
