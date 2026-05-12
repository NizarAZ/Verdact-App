"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, FileText, UploadCloud, X } from "lucide-react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";

type UploadResult = {
  documentId: string;
  title: string;
  fileName: string;
  chunkCount: number;
  textHash: string;
  originalBlobName: string;
  metadataWarning?: string | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateMiddle(value: string, start = 18, end = 14) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function UploadFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  const derivedTitle = useMemo(() => title || file?.name.replace(/\.[^.]+$/, "") || "", [file, title]);
  const canSubmit = Boolean(file && status !== "uploading");

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setTitle(nextFile?.name.replace(/\.[^.]+$/, "") ?? "");
    setResult(null);
    setError("");
    setStatus("idle");
  }

  function clearFile() {
    setFile(null);
    setTitle("");
    setResult(null);
    setError("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("title", derivedTitle);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setResult(payload as UploadResult);
      setStatus("done");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[600px]">
      <BackToDashboard />
      <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
        <div className="border-b border-base p-8">
          <h1 className="font-display text-3xl text-text-primary">Upload document</h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-text-secondary">
            Store a readable document as Shelby blobs, then index its chunks for retrieval.
          </p>
        </div>

        <div className="space-y-6 p-8">
          <input ref={inputRef} type="file" accept=".txt,.md,.markdown,.json,.csv,.pdf,text/*,application/json,application/pdf" className="hidden" onChange={pickFile} />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-48 w-full flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-base bg-bg-base p-8 text-center transition-colors duration-150 ease-in hover:border-strong hover:bg-bg-elevated"
          >
            <UploadCloud className="h-7 w-7 text-brand" />
            <span className="mt-4 font-display text-xl text-text-primary">Choose a document</span>
            <span className="mt-2 font-body text-sm text-text-tertiary">Text, markdown, JSON, CSV, or PDF up to 2 MB</span>
          </button>

          {file ? (
            <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-base bg-bg-base p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="truncate font-body text-sm text-text-primary">{file.name}</p>
                  <p className="mt-1 font-mono text-xs text-text-tertiary">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-base text-text-tertiary transition-colors duration-150 ease-in hover:border-strong hover:text-text-primary"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block font-body text-sm text-text-secondary">Document title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Policy handbook"
              className="h-12 w-full rounded-[var(--radius-md)] border border-base bg-bg-base px-4 font-body text-sm text-text-primary outline-none transition-colors duration-150 ease-in placeholder:text-text-tertiary focus:border-strong"
            />
          </label>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-4 font-body text-sm text-text-secondary">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-5 font-mono text-sm font-medium text-brand-dark transition-opacity duration-150 ease-in disabled:cursor-not-allowed disabled:opacity-45"
          >
            {status === "uploading" ? "Uploading" : "Upload to Shelby"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {result ? (
            <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-5">
              <div className="flex items-center gap-2 font-body text-sm text-text-primary">
                <Check className="h-4 w-4 text-brand" />
                Stored on Shelby
              </div>
              <p className="mt-4 font-body text-sm text-text-primary">{result.title || derivedTitle}</p>
              <p className="mt-3 font-mono text-xs text-text-secondary">
                {result.chunkCount} chunks · {truncateMiddle(result.originalBlobName, 18, 14)}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/app/query" className="inline-flex items-center gap-2 font-mono text-sm text-brand">
                  Ask a question about this document
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/app" className="inline-flex items-center gap-2 font-mono text-sm text-text-secondary hover:text-text-primary">
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
