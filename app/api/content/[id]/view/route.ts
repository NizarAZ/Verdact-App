import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { normalizeWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const viewer = normalizeWalletAddress(request.headers.get("x-wallet-address"));
    const { error } = await supabase.from("content_views").insert({
      content_id: params.id,
      viewer_wallet: viewer
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to record view." }, { status: 500 });
  }
}
