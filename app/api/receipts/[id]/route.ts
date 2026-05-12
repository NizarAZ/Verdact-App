import { NextResponse } from "next/server";
import { findReceipt } from "@/lib/receipts";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const workspaceId = await getWorkspaceId();
  const receipt = await findReceipt(workspaceId, params.id);

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }

  return NextResponse.json(receipt);
}
