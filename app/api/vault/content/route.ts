import { NextResponse } from "next/server";
import { getSupabaseAdmin, getVaultByWallet } from "@/lib/supabase-server";
import { getWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const vault = await getVaultByWallet(walletAddress);
    if (!vault) return NextResponse.json({ error: "Create a vault before uploading content." }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const title = text(body.title, 120);
    const blobId = text(body.blob_id, 300);
    const txHash = text(body.onchain_tx_hash, 120);

    if (!title || !blobId || !txHash) {
      return NextResponse.json({ error: "Missing content title, blob, or transaction." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content")
      .insert({
        vault_id: vault.id,
        wallet_address: walletAddress,
        title,
        description: text(body.description, 1000) || null,
        file_type: text(body.file_type, 120) || "application/octet-stream",
        file_name: text(body.file_name, 255) || null,
        blob_id: blobId,
        onchain_tx_hash: txHash,
        size_bytes: Number.isFinite(Number(body.size_bytes)) ? Number(body.size_bytes) : null,
        duration_seconds: Number.isFinite(Number(body.duration_seconds)) ? Number(body.duration_seconds) : null,
        thumbnail_blob_id: text(body.thumbnail_blob_id, 300) || null,
        allow_download: body.allow_download !== false,
        is_preview: Boolean(body.is_preview)
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ content: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
