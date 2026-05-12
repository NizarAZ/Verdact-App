import { NextResponse } from "next/server";
import { chunkDocument, isSupportedUpload, readFileText, sanitizeBlobSegment, sha256Hex } from "@/lib/document-processing";
import { getEmbedding } from "@/lib/embeddings";
import { getServerAccountAddress, uploadBlobsToShelby } from "@/lib/shelby-server";
import { getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxFileBytes = 2 * 1024 * 1024;

function jsonBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value, null, 2));
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();

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
      return NextResponse.json({ error: "Upload a text, markdown, JSON, or CSV document." }, { status: 400 });
    }

    const { bytes, text } = await readFileText(file);
    const chunks = await chunkDocument(text);

    if (chunks.length === 0) {
      return NextResponse.json({ error: "This document does not contain readable text." }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const compactDocumentId = documentId.replace(/-/g, "");
    const cleanName = sanitizeBlobSegment(file.name);
    const extension = cleanName.includes(".") ? cleanName.split(".").pop() : "txt";
    const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : file.name;
    const documentPrefix = workspaceBlobPrefix(workspaceId, "documents");
    const chunkPrefix = workspaceBlobPrefix(workspaceId, "chunks");
    const originalBlobName = `${documentPrefix}${compactDocumentId}/original.${extension || "txt"}`;
    const metaBlobName = `${documentPrefix}${compactDocumentId}/meta.json`;
    const textHash = await sha256Hex(text);
    const now = new Date().toISOString();
    const accountAddress = getServerAccountAddress();

    const meta = {
      document_id: documentId,
      workspace_id: workspaceId,
      title,
      file_name: file.name,
      content_type: file.type || "text/plain",
      size: file.size,
      text_hash: textHash,
      chunk_count: chunks.length,
      shelby_account: accountAddress,
      shelby_blob: originalBlobName,
      created_at: now
    };

    const chunkEmbeddings = await Promise.all(chunks.map((chunk) => getEmbedding(chunk.text)));
    const chunkPayloads = chunks.map((chunk) => {
      const blobName = `${chunkPrefix}${compactDocumentId}/${String(chunk.index + 1).padStart(4, "0")}.json`;

      return {
        blobName,
        payload: {
          document_id: documentId,
          chunk_index: chunk.index,
          text: chunk.text,
          start: chunk.start,
          end: chunk.end,
          context_hash: chunk.hash,
          embedding: chunkEmbeddings[chunk.index],
          source_blob: originalBlobName,
          created_at: now
        }
      };
    });

    await uploadBlobsToShelby([
      { blobName: originalBlobName, blobData: bytes },
      { blobName: metaBlobName, blobData: jsonBytes(meta) },
      ...chunkPayloads.map((chunk) => ({ blobName: chunk.blobName, blobData: jsonBytes(chunk.payload) }))
    ]);

    return NextResponse.json({
      documentId,
      title,
      fileName: file.name,
      chunkCount: chunks.length,
      textHash,
      originalBlobName,
      metaBlobName
    });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
