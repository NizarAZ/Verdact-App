export function normalizeWalletAddress(address?: string | null) {
  if (!address) return null;
  const trimmed = address.trim().toLowerCase();
  if (!/^0x[a-f0-9]{1,64}$/.test(trimmed)) return null;
  return `0x${trimmed.slice(2).padStart(64, "0")}`;
}

export function requireWalletAddress(value?: string | null) {
  const address = normalizeWalletAddress(value);
  if (!address) throw new Error("Unauthorized");
  return address;
}

export function getWalletAddress(request: Request) {
  return requireWalletAddress(request.headers.get("x-wallet-address"));
}

export function shortenAddress(address?: string | null, front = 6, back = 4) {
  const normalized = normalizeWalletAddress(address);
  if (!normalized) return "";
  return `${normalized.slice(0, front)}...${normalized.slice(-back)}`;
}

export function sameWallet(a?: string | null, b?: string | null) {
  const left = normalizeWalletAddress(a);
  const right = normalizeWalletAddress(b);
  return Boolean(left && right && left === right);
}
