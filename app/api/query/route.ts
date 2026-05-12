import { NextResponse } from "next/server";
import { computeContextHash, type AnswerReceipt, type AnswerSource } from "@/lib/receipts";
import { cosineSimilarity, getEmbedding } from "@/lib/embeddings";
import { downloadBlobText, getAccountBlobs, uploadBlobsToShelby } from "@/lib/shelby-server";
import { getWorkspaceId, workspaceBlobPrefix } from "@/lib/workspace";
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
    const workspaceId = await getWorkspaceId();

    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";

    if (question.length < 3) {
      return NextResponse.json({ error: "Ask a longer question." }, { status: 400 });
    }

    if (!documentId) {
      return NextResponse.json({ error: "Choose a document to ask about." }, { status: 400 });
    }

    const chunkPrefix = workspaceBlobPrefix(workspaceId, "chunks");
    const receiptPrefix = workspaceBlobPrefix(workspaceId, "receipts");
    const chunkBlobs = (await getAccountBlobs()).filter((blob) => blob.name.startsWith(chunkPrefix)).slice(0, 120);

    if (chunkBlobs.length === 0) {
      return NextResponse.json({ error: "Upload a document before asking a question." }, { status: 400 });
    }

    const questionTerms = terms(question);
    const questionEmbedding = await getEmbedding(question);
    const loadedChunks = await Promise.all(
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

    const scoredChunks = loadedChunks
      .filter((chunk): chunk is ScoredAnswerSource => chunk !== null)
      .sort((a, b) => b.score - a.score);
    console.log("similarity scores:", scoredChunks.map((chunk) => ({ index: chunk.chunk_index, score: chunk.score })));

    const topChunks = scoredChunks.slice(0, 3);
    console.log("top chunks selected:", topChunks.length);

    if (topChunks.length === 0) {
      return NextResponse.json({ error: "No readable chunks were found for the selected document." }, { status: 400 });
    }

    const sources = topChunks.map(({ score, ...source }) => source);
    const generated = await generateAnswer(question, sources);
    const receiptId = crypto.randomUUID();
    const contextHash = await computeContextHash(sources);
    const receiptBlobName = `${receiptPrefix}${Date.now()}-${receiptId.replace(/-/g, "")}.json`;
    const receipt: AnswerReceipt = {
      receipt_id: receiptId,
      question,
      answer: generated.answer,
      model: generated.model,
      timestamp: Date.now(),
      sources,
      total_chunks_retrieved: sources.length,
      context_hash: contextHash,
      shelby_receipt_blob: receiptBlobName,
      verified: true
    };

    await uploadBlobsToShelby([
      {
        blobName: receiptBlobName,
        blobData: new TextEncoder().encode(JSON.stringify(receipt, null, 2))
      }
    ]);

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Query failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Query failed." }, { status: 500 });
  }
}
