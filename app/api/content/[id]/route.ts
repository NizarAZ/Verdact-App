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

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("content")
      .update({
        title,
        description: text(body.description, 1000) || null,
        allow_download: body.allow_download !== false,
        is_preview: Boolean(body.is_preview)
      })
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
