import { NextResponse } from "next/server";
import { chunkDocument, isSupportedUpload, readFileText, sanitizeBlobSegment, sha256Hex } from "@/lib/document-processing";
import { createBlobRegistrationPayload, toSerializableTransactionPayload } from "@/lib/onchain";
import { getWalletAddress, getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const maxFileBytes = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const workspaceId = await getWorkspaceId(request);

    const form = await request.formData();
    const file = form.get("file");
    const titleValue = form.get("title");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a document file first." }, { status: 400 });
    }

    if (file.size > maxFileBytes) {
      return NextResponse.json({ error: "Files are limited to 2 MB for this upload flow." }, { status: 400 });
    }

    if (!isSupportedUpload(file)) {
      return NextResponse.json({ error: "Upload a text, markdown, JSON, CSV, or PDF document." }, { status: 400 });
    }

    const { bytes, text } = await readFileText(file);
    const chunks = await chunkDocument(text);

    if (chunks.length === 0) {
      return NextResponse.json({ error: "This document does not contain readable text." }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const compactDocumentId = documentId.replace(/-/g, "");
    const cleanName = sanitizeBlobSegment(file.name);
    const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : file.name;
    const documentPrefix = workspaceBlobPrefix(workspaceId, "documents");
    const originalBlobName = `${documentPrefix}${compactDocumentId}/${cleanName}`;
    const fileHash = await sha256Hex(bytes);
    const textHash = await sha256Hex(text);
    const oneYearMicros = 365 * 24 * 60 * 60 * 1_000_000;
    const expirationMicros = Date.now() * 1000 + oneYearMicros;
    const registration = await createBlobRegistrationPayload({
      walletAddress,
      blobName: originalBlobName,
      blobData: bytes,
      expirationMicros
    });

    return NextResponse.json({
      documentId,
      title,
      fileName: file.name,
      fileSize: file.size,
      chunkCount: chunks.length,
      fileHash,
      textHash,
      originalBlobName,
      blobId: originalBlobName,
      expirationMicros,
      txPayload: toSerializableTransactionPayload(registration.payload),
      blobMerkleRoot: registration.blobMerkleRoot,
      numChunksets: registration.numChunksets
    });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
