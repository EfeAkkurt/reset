"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { SwkAppDarkTheme } from "@creit-tech/stellar-wallets-kit/types";
import { KitEventType } from "@creit-tech/stellar-wallets-kit/types";

interface StellarWalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const StellarWalletContext = createContext<StellarWalletContextType>({
  address: null,
  connect: async () => {},
  disconnect: async () => {},
});

export const useStellarWallet = () => useContext(StellarWalletContext);

export function StellarWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the kit only on the client side
    const initKit = async () => {
      StellarWalletsKit.init({
        modules: defaultModules(),
        theme: {
          ...SwkAppDarkTheme,
          "primary": "#D6A75C", // Gold-300
          "primary-foreground": "#000000",
          "background": "#0A0A0A",
          "background-secondary": "#111111",
          "border": "#333333",
          "font-family": "Inter, sans-serif",
        },
      });

      // Check if already connected by trying to get address
      try {
        const { address: connectedAddress } = await StellarWalletsKit.getAddress();
        if (connectedAddress) {
          setAddress(connectedAddress);
        }
      } catch {
        // Not connected, expected behavior
      }

      // Listen for state updates
      const sub = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
        if (event.payload.address) {
          setAddress(event.payload.address);
        }
      });

      const subDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        setAddress(null);
      });

      return () => {
        // Cleanup subscriptions if possible, though the kit might not expose a direct unsubscribe for all
        // Based on docs: "To unsubscribe from the updates, do this: `sub()`"
        // However, the types might be tricky, assuming sub is a function.
        // If the return type of .on() is a function, we call it.
        if (typeof sub === 'function') (sub as () => void)();
        if (typeof subDisconnect === 'function') (subDisconnect as () => void)();
      };
    };

    initKit();
  }, []);

  const connect = async () => {
    try {
      // The authModal method opens the modal and returns the address when selected
      const { address: newAddress } = await StellarWalletsKit.authModal();
      setAddress(newAddress);
    } catch (e) {
      console.error("Error opening auth modal:", e);
    }
  };

  const disconnect = async () => {
    // The kit doesn't have a global disconnect method exposed easily in the docs for the main class
    // but we can clear our local state. The user usually disconnects via the UI provided by the kit
    // or we can try to force it if needed, but for now we rely on the event listener.
    // However, if we want to provide a disconnect button:
    setAddress(null);
  };

  return (
    <StellarWalletContext.Provider value={{ address, connect, disconnect }}>
      {children}
    </StellarWalletContext.Provider>
  );
}
