import { NextResponse } from "next/server";
import { chunkDocument, isSupportedUpload, readFileText, sanitizeBlobSegment, sha256Hex } from "@/lib/document-processing";
import { getEmbedding } from "@/lib/embeddings";
import { waitForTransaction } from "@/lib/onchain";
import type { DocumentRecord } from "@/lib/supabase-server";
import { insertDocumentRecord } from "@/lib/supabase-server";
import { downloadWalletBlobBytes, putWalletBlob, uploadBlobsToShelby, waitForWalletBlobMetadata, waitForWalletBlobWritten } from "@/lib/shelby-server";
import { getWalletAddress, getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const maxFileBytes = 2 * 1024 * 1024;

function jsonBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value, null, 2));
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId(request);
    const walletAddress = getWalletAddress(request);
    const form = await request.formData();

    const file = form.get("file");
    const titleValue = form.get("title");
    const documentId = typeof form.get("documentId") === "string" ? String(form.get("documentId")) : "";
    const onchainTxHash = typeof form.get("onchainTxHash") === "string" ? String(form.get("onchainTxHash")) : "";
    const blobId = typeof form.get("blobId") === "string" ? String(form.get("blobId")) : "";
    const expectedFileHash = typeof form.get("fileHash") === "string" ? String(form.get("fileHash")) : "";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a document file first." }, { status: 400 });
    }

    if (file.size > maxFileBytes || !isSupportedUpload(file)) {
      return NextResponse.json({ error: "Upload a supported document up to 2 MB." }, { status: 400 });
    }

    if (!documentId || !onchainTxHash || !blobId || !expectedFileHash) {
      return NextResponse.json({ error: "Missing onchain confirmation data." }, { status: 400 });
    }

    const tx = await waitForTransaction(onchainTxHash);
    if (tx?.success === false || String(tx?.sender ?? "").toLowerCase() !== walletAddress) {
      return NextResponse.json({ error: "Onchain transaction is not confirmed for this wallet." }, { status: 400 });
    }

    const { bytes, text } = await readFileText(file);
    const fileHash = await sha256Hex(bytes);
    if (fileHash !== expectedFileHash) {
      return NextResponse.json({ error: "File hash changed after signing." }, { status: 400 });
    }

    const chunks = await chunkDocument(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "This document does not contain readable text." }, { status: 400 });
    }

    await waitForWalletBlobMetadata(walletAddress, blobId);

    try {
      await putWalletBlob({
        accountAddress: walletAddress,
        blobName: blobId,
        blobData: bytes
      });
    } catch (blobUploadError) {
      console.error("Wallet blob upload reported failure", blobUploadError);

      try {
        const storedBytes = await downloadWalletBlobBytes(walletAddress, blobId);
        const storedHash = await sha256Hex(storedBytes);

        if (storedHash !== fileHash) {
          throw new Error("Uploaded Shelby blob hash does not match the selected file.");
        }
      } catch {
        throw blobUploadError;
      }
    }

    const storedBytes = await downloadWalletBlobBytes(walletAddress, blobId);
    const storedHash = await sha256Hex(storedBytes);

    if (storedHash !== fileHash) {
      return NextResponse.json({ error: "Shelby stored blob hash does not match the selected file." }, { status: 502 });
    }

    await waitForWalletBlobWritten(walletAddress, blobId);

    const compactDocumentId = documentId.replace(/-/g, "");
    const cleanName = sanitizeBlobSegment(file.name);
    const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : file.name;
    const documentPrefix = workspaceBlobPrefix(workspaceId, "documents");
    const chunkPrefix = workspaceBlobPrefix(workspaceId, "chunks");
    const originalBlobName = blobId || `${documentPrefix}${compactDocumentId}/${cleanName}`;
    const metaBlobName = `${documentPrefix}${compactDocumentId}/meta.json`;
    const textHash = await sha256Hex(text);
    const now = new Date().toISOString();

    const meta = {
      document_id: documentId,
      workspace_id: workspaceId,
      wallet_address: walletAddress,
      title,
      file_name: file.name,
      content_type: file.type || "text/plain",
      size: file.size,
      file_hash: fileHash,
      text_hash: textHash,
      chunk_count: chunks.length,
      shelby_blob: originalBlobName,
      blob_id: blobId,
      onchain_tx_hash: onchainTxHash,
      created_at: now
    };

    const chunkEmbeddings = await Promise.all(chunks.map((chunk) => getEmbedding(chunk.text)));
    const chunkPayloads = chunks.map((chunk) => {
      const blobName = `${chunkPrefix}${compactDocumentId}/${String(chunk.index + 1).padStart(4, "0")}.json`;

      return {
        blobName,
        payload: {
          document_id: documentId,
          wallet_address: walletAddress,
          chunk_index: chunk.index,
          text: chunk.text,
          start: chunk.start,
          end: chunk.end,
          context_hash: chunk.hash,
          embedding: chunkEmbeddings[chunk.index],
          source_blob: originalBlobName,
          blob_id: blobId,
          created_at: now
        }
      };
    });

    const documentRecord: DocumentRecord = {
      id: documentId,
      wallet_address: walletAddress,
      file_name: file.name,
      title,
      onchain_tx_hash: onchainTxHash,
      blob_id: blobId,
      file_hash: fileHash,
      chunk_count: chunks.length,
      size: file.size,
      created_at: now
    };

    await uploadBlobsToShelby([
      { blobName: metaBlobName, blobData: jsonBytes(meta) },
      ...chunkPayloads.map((chunk) => ({ blobName: chunk.blobName, blobData: jsonBytes(chunk.payload) }))
    ]);

    await insertDocumentRecord(documentRecord);

    return NextResponse.json({
      documentId,
      title,
      fileName: file.name,
      chunkCount: chunks.length,
      fileHash,
      blobId,
      onchainTxHash,
      metaBlobName
    });
  } catch (error) {
    console.error("Upload confirmation failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload confirmation failed." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
