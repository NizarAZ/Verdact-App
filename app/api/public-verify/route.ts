import { NextRequest, NextResponse } from "next/server";
import { computeReceiptIntegrityHash } from "@/lib/receipts";
import { findLocalAnswerReceipt } from "@/lib/local-index";
import { getAnswerReceiptById } from "@/lib/supabase-server";
import type { ReceiptBlobReference } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const maybeError = error as { code?: unknown; message?: unknown };
    const message = typeof maybeError.message === "string" ? maybeError.message : "";

    if (maybeError.code === "PGRST205" || message.includes("answer_receipts")) {
      return "Supabase is missing the answer_receipts table. Run scripts/supabase-onchain-schema.sql in Supabase.";
    }

    return message || "Verification failed.";
  }

  return "Verification failed.";
}

export async function GET(request: NextRequest) {
  try {
    const id = decodeURIComponent(request.nextUrl.searchParams.get("id") ?? "");

    if (!id) {
      return NextResponse.json({ error: "Missing receipt id." }, { status: 400 });
    }

    let receipt = await findLocalAnswerReceipt(id);

    if (!receipt) {
      receipt = await getAnswerReceiptById(id);
    }

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    const recomputedHash = await computeReceiptIntegrityHash(receipt.query, receipt.answer, receipt.blob_ids_used);
    const hashMatches = recomputedHash === receipt.receipt_hash;
    const blobsUsed: ReceiptBlobReference[] =
      receipt.blobs_used ??
      receipt.blob_ids_used.map((path) => ({
        path,
        tx_hash: null,
        file_name: path.split("/").pop() ?? null
      }));

    return NextResponse.json({
      receipt: {
        id: receipt.id,
        wallet_address: receipt.wallet_address,
        created_at: receipt.created_at,
        query: receipt.query,
        answer: receipt.answer,
        blob_ids_used: receipt.blob_ids_used,
        blobs_used: blobsUsed,
        receipt_hash: receipt.receipt_hash
      },
      recomputedHash,
      hashMatches
    });
  } catch (error) {
    console.error("Public verification failed", error);
    return NextResponse.json(
      { error: errorText(error) },
      { status: 500 }
    );
  }
}
