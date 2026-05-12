import { NextResponse } from "next/server";
import { computeContextHash, findReceipt } from "@/lib/receipts";
import { downloadBlobText } from "@/lib/shelby-server";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();

    const body = await request.json().catch(() => ({}));
    const receiptId = typeof body.receiptId === "string" ? body.receiptId.trim() : "";

    if (!receiptId) {
      return NextResponse.json({ error: "Paste a receipt id or blob path." }, { status: 400 });
    }

    const receipt = await findReceipt(workspaceId, receiptId);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    const sourceChecks = await Promise.all(
      receipt.sources.map(async (source) => {
        const text = await downloadBlobText(source.chunk_blob);
        if (!text) return { ...source, found: false, hashMatches: false };

        try {
          const parsed = JSON.parse(text) as { context_hash?: string };
          return {
            ...source,
            found: true,
            hashMatches: parsed.context_hash === source.context_hash
          };
        } catch {
          return { ...source, found: true, hashMatches: false };
        }
      })
    );

    const recomputedContextHash = await computeContextHash(receipt.sources);
    const verified = recomputedContextHash === receipt.context_hash && sourceChecks.every((source) => source.found && source.hashMatches);

    return NextResponse.json({
      receipt,
      verified,
      recomputedContextHash,
      sourceChecks
    });
  } catch (error) {
    console.error("Verification failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed." }, { status: 500 });
  }
}
