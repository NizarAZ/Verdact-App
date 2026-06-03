import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const walletAddress = getWalletAddress(request);
    const body = await request.json().catch(() => ({}));
    const title = text(body.title, 120);
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    const patch: Record<string, unknown> = {
      title,
      description: text(body.description, 1000) || null,
      thumbnail_blob_id: text(body.thumbnail_blob_id, 300) || null,
      allow_download: body.allow_download !== false,
      is_preview: Boolean(body.is_preview)
    };

    const replacementBlobId = text(body.blob_id, 300);
    const replacementTxHash = text(body.onchain_tx_hash, 120);
    if (replacementBlobId || replacementTxHash) {
      if (!replacementBlobId || !replacementTxHash) {
        return NextResponse.json({ error: "Replacement content needs both blob and transaction hash." }, { status: 400 });
      }
      patch.blob_id = replacementBlobId;
      patch.onchain_tx_hash = replacementTxHash;
      patch.file_type = text(body.file_type, 120) || "application/octet-stream";
      patch.file_name = text(body.file_name, 255) || null;
      patch.size_bytes = Number.isFinite(Number(body.size_bytes)) ? Number(body.size_bytes) : null;
      patch.duration_seconds = Number.isFinite(Number(body.duration_seconds)) ? Number(body.duration_seconds) : null;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content")
      .update(patch)
      .eq("id", params.id)
      .eq("wallet_address", walletAddress)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ content: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const walletAddress = getWalletAddress(request);
    const supabase = getSupabaseAdmin();

    const { data: content, error: findError } = await supabase
      .from("content")
      .select("id")
      .eq("id", params.id)
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (findError) throw findError;
    if (!content) return NextResponse.json({ error: "Content not found." }, { status: 404 });

    const { error: viewsError } = await supabase.from("content_views").delete().eq("content_id", params.id);
    if (viewsError) throw viewsError;

    const { error } = await supabase
      .from("content")
      .delete()
      .eq("id", params.id)
      .eq("wallet_address", walletAddress);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
