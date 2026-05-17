import { NextRequest, NextResponse } from "next/server";
import { listDocumentRecordsFromShelby } from "@/lib/storage-index";
import { listDocumentRecords } from "@/lib/supabase-server";
import { getWalletAddress, getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "6");
  if (!Number.isFinite(raw)) return 6;
  return Math.max(1, Math.min(Math.floor(raw), 50));
}

export async function GET(request: NextRequest) {
  try {
    const walletAddress = getWalletAddress(request);
    const documents = await listDocumentRecords(walletAddress, readLimit(request));

    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        document_id: document.id,
        shelby_blob: document.blob_id
      }))
    );
  } catch (error) {
    console.error("Failed to load documents", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const walletAddress = getWalletAddress(request);
    const workspaceId = await getWorkspaceId(request);
    const documents = await listDocumentRecordsFromShelby(workspaceId, walletAddress, readLimit(request));
    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        document_id: document.id,
        shelby_blob: document.blob_id
      }))
    );
  }
}
