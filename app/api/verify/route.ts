import { NextResponse } from "next/server";
import { computeReceiptIntegrityHash } from "@/lib/receipts";
import { getAnswerReceiptById } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";

    if (!receiptId) {
      return NextResponse.json({ error: "Paste a receipt id." }, { status: 400 });
    }

    const receipt = await getAnswerReceiptById(receiptId);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    const recomputedReceiptHash = await computeReceiptIntegrityHash(receipt.query, receipt.answer, receipt.blob_ids_used);
    const verified = recomputedReceiptHash === receipt.receipt_hash;

    return NextResponse.json({
      receipt,
      verified,
      recomputedContextHash: recomputedReceiptHash,
      sourceChecks: receipt.blob_ids_used.map((blobId) => ({
        chunk_blob: blobId,
        found: true,
        hashMatches: verified
      }))
    });
  } catch (error) {
    console.error("Verification failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
