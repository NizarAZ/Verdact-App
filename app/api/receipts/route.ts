import { NextRequest, NextResponse } from "next/server";
import { downloadBlobText, getAccountBlobs } from "@/lib/shelby-server";
import { getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AnswerReceipt = {
  receipt_id?: string;
  id?: string;
  question?: string;
  answer?: string;
  model?: string;
  timestamp?: number;
  sources?: unknown[];
  total_chunks_retrieved?: number;
  context_hash?: string;
  shelby_receipt_blob?: string;
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

function readLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "3");
  if (!Number.isFinite(raw)) return 3;
  return Math.max(1, Math.min(Math.floor(raw), 25));
}

export async function GET(request: NextRequest) {
  const workspaceId = await getWorkspaceId();

  const limit = readLimit(request);

  try {
    const receiptsPrefix = workspaceBlobPrefix(workspaceId, "receipts");
    const receiptBlobs = (await getAccountBlobs())
      .filter((blob) => blob.name.startsWith(receiptsPrefix))
      .sort((a, b) => (toMicros(b.creationMicros) ?? 0) - (toMicros(a.creationMicros) ?? 0))
      .slice(0, limit);

    const receipts = await Promise.all(
      receiptBlobs.map(async (blob) => {
        try {
          const text = await downloadBlobText(blob.name);
          if (!text) return null;

          const parsed = JSON.parse(text) as AnswerReceipt;
          return {
            ...parsed,
            blobName: blob.name,
            creationMicros: blob.creationMicros
          };
        } catch (error) {
          console.error("Failed to parse receipt blob", blob.name, error);
          return null;
        }
      })
    );

    return NextResponse.json(receipts.filter((receipt) => receipt !== null));
  } catch (error) {
    console.error("Failed to load Shelby receipts", error);
    return NextResponse.json([]);
  }
}
