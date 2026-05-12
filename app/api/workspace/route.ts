import { NextResponse } from "next/server";
import { getWorkspaceId, workspacePrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const workspaceId = await getWorkspaceId();

  return NextResponse.json({
    id: workspaceId,
    name: "Personal workspace",
    shelbyPrefix: workspacePrefix(workspaceId)
  });
}
