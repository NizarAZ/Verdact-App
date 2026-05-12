"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

type VerifyResult = {
  verified: boolean;
  recomputedContextHash: string;
  sourceChecks: { chunk_blob: string; found: boolean; hashMatches: boolean }[];
};

export function VerifyFlow() {
  const searchParams = useSearchParams();
  const [receiptId, setReceiptId] = useState(searchParams.get("receipt") ?? "");
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("checking");
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Verification failed.");
      }

      setResult(payload as VerifyResult);
      setStatus("done");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <BackToDashboard />
      <section className="rounded-[var(--radius-lg)] border border-base bg-bg-surface">
        <div className="border-b border-base p-8">
          <h1 className="font-display text-3xl text-text-primary">Verify</h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-text-secondary">Check a receipt against its stored Shelby source chunks.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 p-8">
          <label className="block">
            <span className="mb-2 block font-body text-sm text-text-secondary">Receipt ID or blob path</span>
            <input
              value={receiptId}
              onChange={(event) => setReceiptId(event.target.value)}
              placeholder="receipt id"
              className="h-12 w-full rounded-[var(--radius-md)] border border-base bg-bg-base px-4 font-mono text-sm text-text-primary outline-none transition-colors duration-150 ease-in placeholder:text-text-tertiary focus:border-strong"
            />
          </label>

          {error ? <div className="rounded-[var(--radius-md)] border border-base bg-bg-base p-4 font-body text-sm text-text-secondary">{error}</div> : null}

          <button
            type="submit"
            disabled={status === "checking" || !receiptId.trim()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-brand px-5 font-mono text-sm font-medium text-brand-dark transition-opacity duration-150 ease-in disabled:cursor-not-allowed disabled:opacity-45"
          >
            {status === "checking" ? "Checking" : "Verify receipt"}
            <ShieldCheck className="h-4 w-4" />
          </button>
        </form>

        {result ? (
          <div className="border-t border-base p-8">
            <VerifiedBadge verified={result.verified} />
            <div className="mt-5 space-y-3 rounded-[var(--radius-md)] border border-base bg-bg-base p-5">
              {[
                ["Receipt exists", result.sourceChecks.length > 0],
                ["Source blobs found", result.sourceChecks.every((source) => source.found)],
                ["Context hash matches", result.verified]
              ].map(([label, passed]) => (
                <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-base pb-3 last:border-b-0 last:pb-0">
                  <span className="font-body text-sm text-text-secondary">{label}</span>
                  <span className="inline-flex items-center gap-2 font-body text-xs text-text-primary">
                    <Check className="h-4 w-4 text-brand" />
                    {passed ? "pass" : "check failed"}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <p className="font-body text-xs text-text-tertiary">recomputed context hash</p>
                <p className="mt-2 break-all font-mono text-xs text-text-secondary">{result.recomputedContextHash}</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
