"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider, useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";
import { normalizeWalletAddress } from "@/lib/wallet";

type WalletAccount = ReturnType<typeof useAptosWallet>["account"];

type WalletContextValue = {
  account: WalletAccount;
  address: string | null;
  isConnected: boolean;
  isReady: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmitTransaction: (payload: unknown) => Promise<{ hash: string }>;
  getAuthHeaders: () => HeadersInit;
  walletFetch: typeof fetch;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function WalletContextBridge({ children }: { children: React.ReactNode }) {
  const { account, connect, connected, disconnect, isLoading, signAndSubmitTransaction } = useAptosWallet();
  const address = normalizeWalletAddress(account?.address?.toString());

  useEffect(() => {
    console.log("wallet account:", account);
  }, [account]);

  const value = useMemo<WalletContextValue>(() => {
    const getAuthHeaders = (): HeadersInit => (address ? { "x-wallet-address": address } : {});

    const walletFetch: typeof fetch = (input, init = {}) => {
      const headers = new Headers(init.headers);
      if (address) headers.set("x-wallet-address", address);
      return fetch(input, { ...init, headers });
    };

    return {
      account,
      address,
      isConnected: connected && Boolean(address),
      isReady: true,
      isConnecting: isLoading,
      connect: async () => {
        await connect("Petra");
      },
      disconnect: async () => {
        disconnect();
      },
      signAndSubmitTransaction: async (payload: unknown) => {
        const result = await signAndSubmitTransaction({ data: payload as InputGenerateTransactionPayloadData });
        if (!result?.hash) {
          throw new Error("Wallet did not return a transaction hash.");
        }
        return { hash: result.hash };
      },
      getAuthHeaders,
      walletFetch
    };
  }, [account, address, connect, connected, disconnect, isLoading, signAndSubmitTransaction]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider autoConnect={false} optInWallets={["Petra"]} onError={() => undefined}>
      <WalletContextBridge>{children}</WalletContextBridge>
    </AptosWalletAdapterProvider>
  );
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("useWallet must be used inside WalletProvider.");
  }
  return value;
}
