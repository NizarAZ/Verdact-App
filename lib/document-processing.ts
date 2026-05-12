import { createRequire } from "node:module";

export type DocumentChunk = {
  index: number;
  text: string;
  start: number;
  end: number;
  hash: string;
};

const require = createRequire(import.meta.url);
const textDecoder = new TextDecoder("utf-8", { fatal: false });

export function isSupportedUpload(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/pdf" ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".json") ||
    name.endsWith(".csv") ||
    name.endsWith(".pdf")
  );
}

export function sanitizeBlobSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "document";
}

export async function readFileText(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const pdfParse = require("pdf-parse") as (data: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(Buffer.from(bytes));

    return {
      bytes,
      text: parsed.text.replace(/\u0000/g, "")
    };
  }

  return {
    bytes,
    text: textDecoder.decode(bytes).replace(/\u0000/g, "")
  };
}

export async function sha256Hex(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const input = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", input.buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function chunkDocument(text: string, chunkSize = 1400, overlap = 180): Promise<DocumentChunk[]> {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const targetEnd = Math.min(start + chunkSize, normalized.length);
    let end = targetEnd;

    if (targetEnd < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", targetEnd);
      const sentenceBreak = normalized.lastIndexOf(". ", targetEnd);
      const wordBreak = normalized.lastIndexOf(" ", targetEnd);
      const boundary = Math.max(paragraphBreak, sentenceBreak, wordBreak);

      if (boundary > start + chunkSize * 0.55) {
        end = boundary + (boundary === sentenceBreak ? 1 : 0);
      }
    }

    const chunkText = normalized.slice(start, end).trim();

    if (chunkText) {
      chunks.push({
        index: chunks.length,
        text: chunkText,
        start,
        end,
        hash: await sha256Hex(chunkText)
      });
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}
