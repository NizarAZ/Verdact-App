import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/node";
import { NextResponse } from "next/server";
import { readServerEnv } from "@/lib/server-env";
import { getWalletAddress } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClient() {
  return new ShelbyClient({
    network: Network.SHELBYNET,
    apiKey: readServerEnv("SHELBY_API_KEY") || undefined,
    rpc: {
      baseUrl: process.env.NEXT_PUBLIC_SHELBY_RPC_URL || "https://api.shelbynet.shelby.xyz/shelby",
      apiKey: readServerEnv("SHELBY_API_KEY") || undefined
    }
  });
}

export async function POST(request: Request) {
  try {
    const walletAddress = getWalletAddress(request);
    const form = await request.formData();
    const blobName = String(form.get("blobName") || "");
    const file = form.get("file");

    if (!blobName || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing Shelby blob name or file." }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9._-]{1,63}$/i.test(blobName)) {
      return NextResponse.json({ error: "Invalid Shelby blob name." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    await getClient().rpc.putBlob({
      account: AccountAddress.from(walletAddress),
      blobName,
      blobData: bytes,
      totalBytes: bytes.length
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Shelby upload failed." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
