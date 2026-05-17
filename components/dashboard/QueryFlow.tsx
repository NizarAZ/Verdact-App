"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, FileText, Search } from "lucide-react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { BlobTag } from "@/components/shared/BlobTag";
import { useWallet } from "@/components/WalletProvider";

type QueryReceipt = {
  receipt_id: string;
  id?: string;
  wallet_address?: string;
  question: string;
  answer: string;
  model: string;
  sources: { text: string; chunk_blob: string; context_hash: string }[];
  context_hash: string;
  shelby_receipt_blob: string;
  timestamp?: number;
  receipt_hash?: string;
  blob_ids_used?: string[];
};

type DocumentItem = {
  document_id?: string;
  title?: string;
  file_name?: string;
  chunk_count?: number;
};

function truncateMiddle(value: string, start = 20, end = 14) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function QueryFlow() {
  const { address, walletFetch } = useWallet();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "asking" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<QueryReceipt | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDocuments() {
      // Guard: don't fetch until wallet is connected
      if (!address) {
        if (mounted) setDocumentsLoaded(true);
        return;
      }

      try {
        const response = await walletFetch("/api/documents?limit=25", { cache: "no-store" });
        const payload = (await response.json()) as DocumentItem[];
        const nextDocuments = Array.isArray(payload) ? payload.filter((document) => document.document_id) : [];

        if (mounted) {
          setDocuments(nextDocuments);
          setDocumentId((current) => current || nextDocuments[0]?.document_id || "");
        }
      } catch {
        if (mounted) setDocuments([]);
      } finally {
        if (mounted) setDocumentsLoaded(true);
      }
    }

    loadDocuments();

    // Timeout fallback: force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      if (mounted) setDocumentsLoaded(true);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [address, walletFetch]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("asking");
    setError("");
    setReceipt(null);

    try {
      const response = await walletFetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documentId, walletAddress: address })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Query failed.");
      }

      setReceipt(payload as QueryReceipt);
      setStatus("done");
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "Query failed.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <BackToDashboard />
      <section className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
          <div className="border-b border-base p-8">
            <h1 className="font-display text-3xl text-text-primary">Ask</h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-text-secondary">
              Query uploaded Shelby chunks and receive an answer receipt.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5 p-8">
            <label className="block">
              <span className="mb-2 block font-body text-sm text-text-secondary">Document</span>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
                <select
                  value={documentId}
                  onChange={(event) => setDocumentId(event.target.value)}
                  disabled={!documentsLoaded || documents.length === 0}
                  className="h-12 w-full appearance-none rounded-[var(--radius-md)] border border-base bg-bg-base pl-11 pr-10 font-body text-sm text-text-primary outline-none transition-colors duration-150 ease-in disabled:opacity-50 focus:border-strong"
                >
                  {!documentsLoaded ? <option value="">Loading documents...</option> : null}
                  {documentsLoaded && documents.length === 0 ? <option value="">No documents uploaded</option> : null}
                  {documents.map((document) => (
                    <option key={document.document_id} value={document.document_id}>
                      {document.title || document.file_name || "Untitled document"} ({document.chunk_count ?? 0} chunks)
                    </option>
                  ))}
                </select>
              </div>
              {documentsLoaded && documents.length === 0 ? (
                <Link href="/app/upload" className="mt-3 inline-flex font-mono text-sm text-brand">
                  Upload a document first -&gt;
                </Link>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block font-body text-sm text-text-secondary">Question</span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What does this document say about the account?"
                className="min-h-36 w-full resize-y rounded-[var(--radius-md)] border border-base bg-bg-base p-4 font-body text-sm text-text-primary outline-none transition-colors duration-150 ease-in placeholder:text-text-tertiary focus:border-strong"
              />
            </label>

            {error ? <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-4 font-body text-sm text-text-secondary">{error}</div> : null}

            <button
              type="submit"
              disabled={status === "asking" || question.trim().length < 3 || !documentId}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-5 font-mono text-sm font-medium text-brand-dark transition-opacity duration-150 ease-in disabled:cursor-not-allowed disabled:opacity-45"
            >
              {status === "asking" ? "Searching" : "Ask"}
              <Search className="h-4 w-4" />
            </button>
          </form>

          {receipt ? (
            <div className="border-t border-base p-8">
              <div className="flex items-center gap-2 font-body text-sm text-text-primary">
                <Check className="h-4 w-4 text-brand" />
                Answer receipt stored
              </div>
              <p className="mt-5 whitespace-pre-wrap font-body text-sm leading-6 text-text-primary">{receipt.answer}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <BlobTag value={`${receipt.sources.length} sources`} />
                <BlobTag value={truncateMiddle(receipt.receipt_hash ?? receipt.context_hash, 12, 10)} />
              </div>
              {receipt.receipt_id ? (
                <Link href={`/verify/${encodeURIComponent(receipt.receipt_id)}`} className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-brand">
                  Verify this answer
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          ) : null}
      </section>
    </div>
  );
}
