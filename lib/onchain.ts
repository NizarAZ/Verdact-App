import { SHELBYUSD_FA_METADATA_ADDRESS } from "@shelby-protocol/sdk/browser";
import { amountToMicroUnits, microUnitsToAmount, shelbyUsdMicroUnits } from "@/lib/amount";
import { normalizeWalletAddress } from "@/lib/wallet";

export const shelbyExplorerBaseUrl = "https://explorer.aptoslabs.com/txn";
export const shelbyUsdMetadataAddress = SHELBYUSD_FA_METADATA_ADDRESS;
export { amountToMicroUnits, microUnitsToAmount, shelbyUsdMicroUnits };

export function getFullnodeUrl() {
  return process.env.NEXT_PUBLIC_SHELBY_FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1";
}

export function getExplorerUrl(txHash: string) {
  return `${shelbyExplorerBaseUrl}/${encodeURIComponent(txHash)}?network=shelbynet`;
}

function normalizePayloadValue(value: unknown) {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && "inner" in value) return String((value as { inner: unknown }).inner).toLowerCase();
  return String(value ?? "").toLowerCase();
}

function getPayloadParts(payload: Record<string, unknown>) {
  const args = (payload.arguments ?? payload.functionArguments ?? []) as unknown[];
  const typeArgs = (payload.type_arguments ?? payload.typeArguments ?? []) as unknown[];
  const fn = String(payload.function ?? "");
  return { args, typeArgs, fn };
}

export async function fetchTransaction(txHash: string) {
  const response = await fetch(`${getFullnodeUrl()}/transactions/by_hash/${encodeURIComponent(txHash)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Transaction not found on Shelbynet.");
  }

  return response.json();
}

export async function waitForTransaction(txHash: string, timeoutMs = 60_000) {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const tx = await fetchTransaction(txHash);
      if (tx?.success === false) throw new Error(tx.vm_status || "Onchain transaction failed.");
      return tx;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Transaction was not found on Shelbynet in time.");
}

export async function verifyShelbyUsdTransfer(params: {
  txHash: string;
  senderWallet: string;
  recipientWallet: string;
  expectedAmountMicroUnits: bigint;
}) {
  const sender = normalizeWalletAddress(params.senderWallet);
  const recipient = normalizeWalletAddress(params.recipientWallet);
  if (!sender || !recipient) throw new Error("Invalid wallet address.");

  const txData = await fetchTransaction(params.txHash);
  const payload = txData?.payload as Record<string, unknown> | undefined;
  if (txData?.success !== true || normalizeWalletAddress(txData?.sender) !== sender || !payload) {
    throw new Error("Invalid transaction.");
  }

  const { args, typeArgs, fn } = getPayloadParts(payload);
  let recipientArg = "";
  let amountArg = "";
  let assetArg = "";

  if (fn.includes("primary_fungible_store::transfer")) {
    assetArg = normalizePayloadValue(args[0]);
    recipientArg = normalizePayloadValue(args[1]);
    amountArg = normalizePayloadValue(args[2]);
  } else if (fn.includes("coin::transfer") || fn.includes("aptos_account::transfer_coins")) {
    assetArg = normalizePayloadValue(typeArgs[0]);
    recipientArg = normalizePayloadValue(args[0]);
    amountArg = normalizePayloadValue(args[1]);
  } else {
    throw new Error("Invalid transaction function.");
  }

  if (
    normalizeWalletAddress(recipientArg) !== recipient ||
    normalizeWalletAddress(assetArg) !== normalizeWalletAddress(shelbyUsdMetadataAddress) ||
    BigInt(amountArg) !== params.expectedAmountMicroUnits
  ) {
    throw new Error("Invalid transaction.");
  }

  return txData;
}
