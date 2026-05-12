import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export type BlobFolder = "documents" | "chunks" | "receipts";

export async function getWorkspaceId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return crypto.createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

export function workspacePrefix(workspaceId: string) {
  return `v/${workspaceId}`;
}

export function workspaceBlobPrefix(workspaceId: string, folder: BlobFolder) {
  const folderSegment = {
    documents: "d",
    chunks: "c",
    receipts: "r"
  }[folder];

  return `${workspacePrefix(workspaceId)}/${folderSegment}/`;
}
