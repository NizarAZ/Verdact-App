import { NextRequest, NextResponse } from "next/server";
import { downloadBlobText, getAccountBlobs } from "@/lib/shelby-server";
import { getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredDocumentMeta = {
  document_id?: string;
  title?: string;
  file_name?: string;
  content_type?: string;
  size?: number;
  text_hash?: string;
  chunk_count?: number;
  shelby_blob?: string;
  created_at?: string;
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
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? "6");
  if (!Number.isFinite(raw)) return 6;
  return Math.max(1, Math.min(Math.floor(raw), 50));
}

export async function GET(request: NextRequest) {
  const workspaceId = await getWorkspaceId();

  const limit = readLimit(request);

  try {
    const documentsPrefix = workspaceBlobPrefix(workspaceId, "documents");
    const metaBlobs = (await getAccountBlobs())
      .filter((blob) => blob.name.startsWith(documentsPrefix) && blob.name.endsWith("/meta.json"))
      .sort((a, b) => (toMicros(b.creationMicros) ?? 0) - (toMicros(a.creationMicros) ?? 0))
      .slice(0, limit);

    const documents = await Promise.all(
      metaBlobs.map(async (blob) => {
        try {
          const text = await downloadBlobText(blob.name);
          if (!text) return null;

          const parsed = JSON.parse(text) as StoredDocumentMeta;

          return {
            ...parsed,
            metaBlobName: blob.name,
            creationMicros: blob.creationMicros
          };
        } catch (error) {
          console.error("Failed to parse document metadata blob", blob.name, error);
          return null;
        }
      })
    );

    return NextResponse.json(documents.filter((document) => document !== null));
  } catch (error) {
    console.error("Failed to load Shelby documents", error);
    return NextResponse.json([]);
  }
}
