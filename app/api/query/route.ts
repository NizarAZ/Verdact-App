import { NextResponse } from "next/server";
import { computeContextHash, computeReceiptIntegrityHash, type AnswerReceipt, type AnswerSource } from "@/lib/receipts";
import { cosineSimilarity, getEmbedding } from "@/lib/embeddings";
import { downloadBlobText, getAccountBlobs } from "@/lib/shelby-server";
import { getDocumentRecordFromShelby } from "@/lib/storage-index";
import { getDocumentRecord } from "@/lib/supabase-server";
import { getDocumentRecordByBlobId, insertAnswerReceiptRecord, type DocumentRecord, type ReceiptBlobReference } from "@/lib/supabase-server";
import { getWalletAddress, normalizeWalletAddress, workspaceBlobPrefix, workspaceIdFromWalletAddress } from "@/lib/workspace";
import { generateWithFallback } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredChunk = {
  document_id?: string;
  chunk_index?: number;
  text?: string;
  context_hash?: string;
  source_blob?: string;
  embedding?: number[];
};

type ScoredAnswerSource = AnswerSource & {
  score: number;
};

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const maybeError = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
    const message = typeof maybeError.message === "string" ? maybeError.message : "";
    const details = typeof maybeError.details === "string" ? maybeError.details : "";
    const hint = typeof maybeError.hint === "string" ? maybeError.hint : "";

    if (maybeError.code === "PGRST205" || message.includes("answer_receipts")) {
      return "Supabase is missing the answer_receipts table. Run scripts/supabase-onchain-schema.sql in Supabase, then ask again.";
    }

    return [message, details, hint].filter(Boolean).join(" ") || "Query failed.";
  }

  return "Query failed.";
}

function terms(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((term) => term.length > 2);
}

function scoreChunk(questionTerms: string[], text: string) {
  const lower = text.toLowerCase();
  return questionTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
}

async function buildBlobReferences(params: {
  walletAddress: string;
  blobPaths: string[];
  selectedDocument: DocumentRecord;
}) {
  const references: ReceiptBlobReference[] = [];

  for (const path of params.blobPaths) {
    let documentRecord: DocumentRecord | null = params.selectedDocument.blob_id === path ? params.selectedDocument : null;

    if (!documentRecord) {
      try {
        documentRecord = await getDocumentRecordByBlobId(params.walletAddress, path);
      } catch {
        documentRecord = null;
      }
    }

    references.push({
      path,
      tx_hash: documentRecord?.onchain_tx_hash ?? null,
      file_name: documentRecord?.file_name ?? path.split("/").pop() ?? null
    });
  }

  return references;
}

async function generateAnswer(question: string, sources: AnswerSource[]) {
  const context = sources.map((source, index) => `SOURCE ${index + 1}\n${source.text}`).join("\n\n");
  console.log("context length (chars):", context.length);
  console.log("CONTEXT SENT TO LLM:", context);
  const prompt = `Answer this question in one short sentence using only the facts in the context below. Do not copy the context. Do not explain. Just answer.

Question: ${question}

Context:
${context}

Answer in one sentence:`;

  console.time("llm");
  try {
    const generated = await generateWithFallback(prompt);

    return {
      model: generated.modelUsed,
      answer: generated.answer.trim()
    };
  } finally {
    console.timeEnd("llm");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
    const bodyWalletAddress = typeof body.walletAddress === "string" ? normalizeWalletAddress(body.walletAddress) : null;
    const walletAddress = bodyWalletAddress ?? getWalletAddress(request);
    const workspaceId = workspaceIdFromWalletAddress(walletAddress);

    if (question.length < 3) {
      return NextResponse.json({ error: "Ask a longer question." }, { status: 400 });
    }

    if (!documentId) {
      return NextResponse.json({ error: "Choose a document to ask about." }, { status: 400 });
    }

    let documentRecord = null;
    try {
      documentRecord = await getDocumentRecord(walletAddress, documentId);
    } catch {
      documentRecord = null;
    }

    if (!documentRecord) {
      documentRecord =
        await getDocumentRecordFromShelby(workspaceId, walletAddress, documentId);
    }

    if (!documentRecord?.onchain_tx_hash) {
      return NextResponse.json({ error: "Document is not confirmed onchain." }, { status: 404 });
    }

    const questionTerms = terms(question);
    const questionEmbedding = await getEmbedding(question);
    const chunkPrefix = workspaceBlobPrefix(workspaceId, "chunks");
    const chunkBlobs = (await getAccountBlobs()).filter((blob) => blob.name.startsWith(chunkPrefix)).slice(0, 120);
    const shelbyLoadedChunks = await Promise.all(
      chunkBlobs.map(async (blob) => {
        try {
          const text = await downloadBlobText(blob.name);
          if (!text) return null;

          const parsed = JSON.parse(text) as StoredChunk;
            if (!parsed.text || !parsed.context_hash || parsed.document_id !== documentId) return null;

          const score = Array.isArray(parsed.embedding)
            ? cosineSimilarity(questionEmbedding, parsed.embedding)
            : scoreChunk(questionTerms, parsed.text);
          const source: ScoredAnswerSource = {
            text: parsed.text,
            context_hash: parsed.context_hash,
            chunk_blob: blob.name,
            score
          };

          if (parsed.document_id) source.document_id = parsed.document_id;
          if (typeof parsed.chunk_index === "number") source.chunk_index = parsed.chunk_index;
          if (parsed.source_blob) source.source_blob = parsed.source_blob;

          return source;
        } catch {
          return null;
        }
      })
    );

    const scoredChunks = shelbyLoadedChunks
      .filter((chunk): chunk is ScoredAnswerSource => chunk !== null)
      .sort((a, b) => b.score - a.score);
    console.log("similarity scores:", scoredChunks.map((chunk) => ({ index: chunk.chunk_index, score: chunk.score })));

    const topChunks = scoredChunks.slice(0, 3);
    console.log("top chunks selected:", topChunks.length);

    if (topChunks.length === 0) {
      return NextResponse.json({ error: "No readable chunks were found for the selected document." }, { status: 400 });
    }

    const sources = topChunks.map(({ score, ...source }) => source);
    const blobIdsUsed = [...new Set(sources.map((source) => source.source_blob ?? source.chunk_blob))];
    const blobsUsed = await buildBlobReferences({
      walletAddress,
      blobPaths: blobIdsUsed,
      selectedDocument: documentRecord
    });
    const generated = await generateAnswer(question, sources);
    const receiptId = crypto.randomUUID();
    const contextHash = await computeContextHash(sources);
    const receipt: AnswerReceipt = {
      receipt_id: receiptId,
      wallet_address: walletAddress,
      question,
      answer: generated.answer,
      model: generated.model,
      timestamp: Date.now(),
      sources,
      total_chunks_retrieved: sources.length,
      context_hash: contextHash,
      shelby_receipt_blob: "",
      verified: false
    };
    const receiptHash = await computeReceiptIntegrityHash(question, generated.answer, blobIdsUsed);

    let savedReceipt;
    try {
      savedReceipt = await insertAnswerReceiptRecord({
        id: receiptId,
        wallet_address: walletAddress,
        query: question,
        answer: generated.answer,
        receipt_hash: receiptHash,
        onchain_tx_hash: "",
        blob_ids_used: blobIdsUsed,
        blobs_used: blobsUsed,
        receipt_blob_id: null
      });
    } catch (receiptError) {
      console.error("Supabase receipt index failed", receiptError);
      savedReceipt = {
        id: receiptId,
        wallet_address: walletAddress,
        query: question,
        answer: generated.answer,
        receipt_hash: receiptHash,
        onchain_tx_hash: "",
        blob_ids_used: blobIdsUsed,
        blobs_used: blobsUsed,
        receipt_blob_id: null,
        created_at: new Date().toISOString()
      };
    }

    return NextResponse.json({
      ...receipt,
      receipt_id: savedReceipt.id,
      receipt_hash: receiptHash,
      blob_ids_used: blobIdsUsed,
      blobs_used: blobsUsed
    });
  } catch (error) {
    console.error("Query failed", error);
    return NextResponse.json(
      { error: errorText(error) },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
