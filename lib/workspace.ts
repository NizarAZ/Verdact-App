import crypto from "crypto";

export type BlobFolder = "documents" | "chunks" | "receipts";

export function normalizeWalletAddress(address?: string | null) {
  if (!address) return null;
  const trimmed = address.trim().toLowerCase();
  if (!/^0x[a-f0-9]{1,64}$/.test(trimmed)) {
    return null;
  }

  return `0x${trimmed.slice(2).padStart(64, "0")}`;
}

export function getWalletAddress(request: Request) {
  const address = normalizeWalletAddress(request.headers.get("x-wallet-address"));

  if (!address) {
    throw new Error("Unauthorized");
  }

  return address;
}

export async function getWorkspaceId(request: Request): Promise<string> {
  const walletAddress = getWalletAddress(request);

  return workspaceIdFromWalletAddress(walletAddress);
}

export function workspaceIdFromWalletAddress(walletAddress: string) {
  return crypto.createHash("sha256").update(walletAddress).digest("hex").slice(0, 12);
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
