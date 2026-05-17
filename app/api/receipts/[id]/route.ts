import { NextResponse } from "next/server";
import { getAnswerReceiptById } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const receipt = await getAnswerReceiptById(decodeURIComponent(params.id));

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    return NextResponse.json({
      receipt_id: receipt.id,
      wallet_address: receipt.wallet_address,
      question: receipt.query,
      answer: receipt.answer,
      context_hash: receipt.receipt_hash,
      receipt_hash: receipt.receipt_hash,
      onchain_tx_hash: receipt.onchain_tx_hash,
      blob_ids_used: receipt.blob_ids_used,
      created_at: receipt.created_at,
      verified: Boolean(receipt.receipt_hash),
      sources: receipt.blob_ids_used.map((blobId) => ({
        text: "",
        chunk_blob: blobId,
        context_hash: receipt.receipt_hash
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to load receipt", error);
    return NextResponse.json({ error: "Receipt failed." }, { status: 500 });
  }
}
