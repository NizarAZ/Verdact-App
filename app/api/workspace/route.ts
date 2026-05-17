import { NextResponse } from "next/server";
import { getWorkspaceId, workspacePrefix } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workspaceId = await getWorkspaceId(request);

    return NextResponse.json({
      id: workspaceId,
      name: "Personal workspace",
      shelbyPrefix: workspacePrefix(workspaceId)
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Workspace failed." }, { status: 500 });
  }
}
