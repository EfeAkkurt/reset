"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type StellarWalletsKitType =
  typeof import("@creit-tech/stellar-wallets-kit/sdk").StellarWalletsKit;

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
  const kitRef = useRef<StellarWalletsKitType | null>(null);

  useEffect(() => {
    let teardown: (() => void) | undefined;

    // Initialize the kit only on the client side
    const initKit = async () => {
      try {
        const [{ StellarWalletsKit }, { defaultModules }, kitTypes] =
          await Promise.all([
            import("@creit-tech/stellar-wallets-kit/sdk"),
            import("@creit-tech/stellar-wallets-kit/modules/utils"),
            import("@creit-tech/stellar-wallets-kit/types"),
          ]);

        kitRef.current = StellarWalletsKit;

        StellarWalletsKit.init({
          modules: defaultModules(),
          theme: {
            ...kitTypes.SwkAppDarkTheme,
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
        const sub = StellarWalletsKit.on(kitTypes.KitEventType.STATE_UPDATED, (event) => {
          if (event.payload.address) {
            setAddress(event.payload.address);
          }
        });

        const subDisconnect = StellarWalletsKit.on(kitTypes.KitEventType.DISCONNECT, () => {
          setAddress(null);
        });

        teardown = () => {
          if (typeof sub === "function") sub();
          if (typeof subDisconnect === "function") subDisconnect();
        };
      } catch (err) {
        console.error("Failed to initialize StellarWalletsKit", err);
      }
    };

    initKit();

    return () => {
      if (teardown) teardown();
    };
  }, []);

  const connect = async () => {
    try {
      // The authModal method opens the modal and returns the address when selected
      const kit = kitRef.current;
      if (!kit) throw new Error("Stellar wallet kit not ready");
      const { address: newAddress } = await kit.authModal();
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
