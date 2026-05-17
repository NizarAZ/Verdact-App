import { NextRequest, NextResponse } from "next/server";
import { listDocumentRecordsFromShelby } from "@/lib/storage-index";
import { listDocumentRecords, type DocumentRecord } from "@/lib/supabase-server";
import { getWalletAddress, getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "6");
  if (!Number.isFinite(raw)) return 6;
  return Math.max(1, Math.min(Math.floor(raw), 50));
}

function documentKey(document: DocumentRecord) {
  return document.file_hash || document.id || document.blob_id;
}

function sortByNewest(documents: DocumentRecord[]) {
  return [...documents].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

function serializeDocuments(documents: DocumentRecord[], limit: number) {
  const seen = new Set<string>();

  return sortByNewest(documents)
    .filter((document) => {
      const key = documentKey(document);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((document) => ({
      ...document,
      document_id: document.id,
      shelby_blob: document.blob_id
    }));
}

export async function GET(request: NextRequest) {
  const limit = readLimit(request);

  try {
    const walletAddress = getWalletAddress(request);
    const workspaceId = await getWorkspaceId(request);
    const [supabaseResult, shelbyResult] = await Promise.allSettled([
      listDocumentRecords(walletAddress, limit),
      listDocumentRecordsFromShelby(workspaceId, walletAddress, limit)
    ]);

    if (supabaseResult.status === "rejected") {
      console.error("Failed to load Supabase documents", supabaseResult.reason);
    }

    if (shelbyResult.status === "rejected") {
      console.error("Failed to load Shelby documents", shelbyResult.reason);
    }

    const documents = [
      ...(supabaseResult.status === "fulfilled" ? supabaseResult.value : []),
      ...(shelbyResult.status === "fulfilled" ? shelbyResult.value : [])
    ];

    return NextResponse.json(serializeDocuments(documents, limit));
  } catch (error) {
    console.error("Failed to load documents", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json([]);
  }
}
