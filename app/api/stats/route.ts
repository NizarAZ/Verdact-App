import { NextResponse } from "next/server";
import { getAccountBlobs, getServerAccountAddress } from "@/lib/shelby-server";
import { getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toMicros(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET() {
  const workspaceId = await getWorkspaceId();

  const accountAddress = getServerAccountAddress();

  try {
    const prefixes = {
      documents: workspaceBlobPrefix(workspaceId, "documents"),
      chunks: workspaceBlobPrefix(workspaceId, "chunks"),
      receipts: workspaceBlobPrefix(workspaceId, "receipts")
    };
    const blobs = await getAccountBlobs();

    const workspaceBlobs = blobs.filter(
      (blob) =>
        blob.name.startsWith(prefixes.documents) ||
        blob.name.startsWith(prefixes.chunks) ||
        blob.name.startsWith(prefixes.receipts)
    );
    const documents = workspaceBlobs.filter((blob) => blob.name.startsWith(prefixes.documents) && blob.name.endsWith("/meta.json")).length;
    const chunks = workspaceBlobs.filter((blob) => blob.name.startsWith(prefixes.chunks)).length;
    const receipts = workspaceBlobs.filter((blob) => blob.name.startsWith(prefixes.receipts)).length;
    const activity = workspaceBlobs
      .map((blob) => toMicros(blob.creationMicros))
      .filter((value): value is number => value !== null);

    return NextResponse.json({
      documents,
      chunks,
      receipts,
      lastActivityMicros: activity.length ? Math.max(...activity) : null,
      accountAddress,
      workspaceId
    });
  } catch (error) {
    console.error("Failed to load Shelby stats", error);

    return NextResponse.json({
      documents: 0,
      chunks: 0,
      receipts: 0,
      lastActivityMicros: null,
      accountAddress
    });
  }
}
