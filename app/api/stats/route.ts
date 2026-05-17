import { NextResponse } from "next/server";
import { getServerAccountAddress } from "@/lib/shelby-server";
import { listDocumentRecordsFromShelby } from "@/lib/storage-index";
import { listAnswerReceiptRecords, listDocumentRecords } from "@/lib/supabase-server";
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

export async function GET(request: Request) {
  const accountAddress = getServerAccountAddress();
  const { searchParams } = new URL(request.url);
  const walletAddressFromQuery = searchParams.get("wallet");

  try {
    const walletAddress = walletAddressFromQuery || getWalletAddress(request);
    const workspaceId = await getWorkspaceId(request);
    const [documents, receipts] = await Promise.all([
      listDocumentRecords(walletAddress, 500),
      listAnswerReceiptRecords(walletAddress, 500)
    ]);
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
      accountAddress,
      workspaceId
    });
  } catch (error) {
    console.error("Failed to load stats", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const walletAddress = getWalletAddress(request);
      const workspaceId = await getWorkspaceId(request);
      const documents = await listDocumentRecordsFromShelby(workspaceId, walletAddress, 500);
      const chunks = documents.reduce((total, document) => total + (document.chunk_count ?? 0), 0);
      const lastActivityAt = latestActivityIso(documents.map((item) => item.created_at));

      return NextResponse.json({
        documents: documents.length,
        chunks,
        receipts: 0,
        onchainRegistrations: documents.length,
        lastActivityAt,
        lastActivityMicros: lastActivityAt ? Date.parse(lastActivityAt) * 1000 : null,
        accountAddress,
        workspaceId
      });
    } catch (fallbackError) {
      console.error("Failed to load fallback stats", fallbackError);
    }

    return NextResponse.json({
      documents: 0,
      chunks: 0,
      receipts: 0,
      onchainRegistrations: 0,
      lastActivityAt: null,
      lastActivityMicros: null,
      accountAddress
    });
  }
}
