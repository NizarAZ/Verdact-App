import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { SHELBYUSD_FA_METADATA_ADDRESS, ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { readServerEnv } from "@/lib/server-env";

export type ShelbyBlobMetadata = {
  name: string;
  creationMicros?: number | string | null;
};

const minAptOctas = 50_000_000;
const aptTopUpOctas = 1_000_000_000;
const minShelbyUsdUnits = 1_000_000;
const shelbyUsdTopUpUnits = 1_000_000_000;

function normalizeBlobName(name: string) {
  return name.replace(/^@[0-9a-fA-Fx]+\/?/, "");
}

export function getServerAccount() {
  const privateKey = readServerEnv("APTOS_PRIVATE_KEY");

  if (!privateKey) {
    return null;
  }

  return Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(privateKey)
  });
}

export function getServerAccountAddress() {
  const account = getServerAccount();
  return account?.accountAddress.toString() ?? null;
}

export function getShelbyClient() {
  const apiKey = readServerEnv("SHELBY_API_KEY");
  const faucetAuthToken = readServerEnv("SHELBY_FAUCET_AUTH_TOKEN");

  return new ShelbyNodeClient({
    network: Network.SHELBYNET,
    apiKey: apiKey || undefined,
    faucet: faucetAuthToken ? { authToken: faucetAuthToken } : undefined
  });
}

async function getAptBalance(client: ShelbyNodeClient, address: string) {
  try {
    return Number(await client.aptos.getAccountAPTAmount({ accountAddress: address }));
  } catch {
    return 0;
  }
}

async function getShelbyUsdBalance(client: ShelbyNodeClient, address: string) {
  try {
    return Number(
      await client.aptos.getBalance({
        accountAddress: address,
        asset: SHELBYUSD_FA_METADATA_ADDRESS
      })
    );
  } catch {
    return 0;
  }
}

export async function getServerFundingStatus() {
  const account = getServerAccount();

  if (!account) {
    return null;
  }

  const client = getShelbyClient();
  const address = account.accountAddress.toString();

  return {
    address,
    aptOctas: await getAptBalance(client, address),
    shelbyUsdUnits: await getShelbyUsdBalance(client, address)
  };
}

export async function ensureServerFunding() {
  const account = getServerAccount();

  if (!account) {
    throw new Error("Aptos account is not configured.");
  }

  const client = getShelbyClient();
  const address = account.accountAddress.toString();
  let aptBalance = await getAptBalance(client, address);
  let shelbyUsdBalance = await getShelbyUsdBalance(client, address);

  if (aptBalance < minAptOctas) {
    await client.fundAccountWithAPT({
      address,
      amount: aptTopUpOctas
    });
    aptBalance = await getAptBalance(client, address);
  }

  if (shelbyUsdBalance < minShelbyUsdUnits) {
    await client.fundAccountWithShelbyUSD({
      address,
      amount: shelbyUsdTopUpUnits
    });
    shelbyUsdBalance = await getShelbyUsdBalance(client, address);
  }

  if (aptBalance < minAptOctas) {
    throw new Error(`Server Shelby account ${address} needs APT for transaction fees.`);
  }

  if (shelbyUsdBalance < minShelbyUsdUnits) {
    throw new Error(`Server Shelby account ${address} needs ShelbyUSD storage funds.`);
  }
}

function normalizeShelbyUploadError(error: unknown, address: string) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE")) {
    return new Error(`Server Shelby account ${address} needs more APT for transaction fees.`);
  }

  if (message.includes("E_INSUFFICIENT_FUNDS") || message.includes("blob storage")) {
    return new Error(`Server Shelby account ${address} needs more ShelbyUSD storage funds.`);
  }

  if (message.includes("Failed to upload part") || message.includes("Internal Server Error")) {
    return new Error("Shelby storage accepted the registration but its upload endpoint returned 500. Verdact retried the upload and could not complete it yet.");
  }

  return error instanceof Error ? error : new Error(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Failed to upload part") ||
    message.includes("Internal Server Error") ||
    message.includes("status: 500") ||
    message.includes("interrupted while sending data")
  );
}

export async function getAccountBlobs(): Promise<ShelbyBlobMetadata[]> {
  const account = getServerAccount();

  if (!account) {
    return [];
  }

  const client = getShelbyClient();
  const blobs = await client.coordination.getAccountBlobs({
    account: account.accountAddress
  });

  return blobs.map((blob) => ({
    name: normalizeBlobName(blob.name),
    creationMicros: blob.creationMicros
  }));
}

export async function downloadBlobText(blobName: string) {
  const account = getServerAccount();

  if (!account) {
    return null;
  }

  const client = getShelbyClient();
  const blob = await client.download({
    account: account.accountAddress,
    blobName: normalizeBlobName(blobName)
  });

  const response = new Response(blob.readable);
  return response.text();
}

export async function uploadBlobsToShelby(
  blobs: {
    blobName: string;
    blobData: Uint8Array;
  }[]
) {
  const account = getServerAccount();

  if (!account) {
    throw new Error("Aptos account is not configured.");
  }

  if (blobs.length === 0) {
    return;
  }

  const oneYearMicros = 365 * 24 * 60 * 60 * 1_000_000;
  const expirationMicros = Date.now() * 1000 + oneYearMicros;
  const client = getShelbyClient();
  const address = account.accountAddress.toString();

  await ensureServerFunding();

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await client.batchUpload({
        signer: account,
        expirationMicros,
        blobs
      });
      return;
    } catch (error) {
      lastError = error;

      if (!isRetryableStorageError(error)) {
        throw normalizeShelbyUploadError(error, address);
      }

      await sleep(600 * (attempt + 1));
    }
  }

  for (const blob of blobs) {
    let uploaded = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await client.upload({
          signer: account,
          expirationMicros,
          blobName: blob.blobName,
          blobData: blob.blobData
        });
        uploaded = true;
        break;
      } catch (error) {
        lastError = error;

        if (!isRetryableStorageError(error)) {
          throw normalizeShelbyUploadError(error, address);
        }

        await sleep(800 * (attempt + 1));
      }
    }

    if (!uploaded) {
      throw normalizeShelbyUploadError(lastError, address);
    }
  }
}
