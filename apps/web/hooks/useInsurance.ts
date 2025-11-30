import { useCallback, useEffect, useMemo, useState } from "react";
import { RiskLevel } from "../../../packages/sdk/src/types";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";
import { getResetSdk } from "@/lib/sdk/resetSdk";

type OpportunityLike = {
  id: string;
  protocol: string;
  pair: string;
  tvlUsd: number;
};

type StoredInsurance = Record<
  string,
  {
    txHash?: string;
    ts: number;
  }
>;

const STORAGE_PREFIX = "reset_insured_v1";

const loadFromStorage = (address: string | null): StoredInsurance => {
  if (!address) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${address}`);
    return raw ? (JSON.parse(raw) as StoredInsurance) : {};
  } catch {
    return {};
  }
};

const persistToStorage = (address: string, data: StoredInsurance) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${address}`, JSON.stringify(data));
  } catch {
    // Ignore quota errors in demo context
  }
};

export function useInsurance() {
  const { address, connect, signAndSend } = useStellarWallet();
  const [insured, setInsured] = useState<StoredInsurance>({});
  const [insuring, setInsuring] = useState(false);

  useEffect(() => {
    setInsured(loadFromStorage(address));
  }, [address]);

  const isInsured = useCallback(
    (opportunityId: string) => Boolean(insured[opportunityId]),
    [insured],
  );

  const insure = useCallback(
    async (opportunity: OpportunityLike, opts?: { coverageUsd?: number }) => {
      if (!address) {
        await connect();
        return { connected: false as const };
      }

      if (insuring) {
        return { success: false as const, error: "Already processing insurance" };
      }

      setInsuring(true);
      try {
        const sdk = getResetSdk();
        const simple = sdk.getSimpleInsurance();

        const coverageUsd =
          opts?.coverageUsd ??
          Math.max(100, Math.min(2000, Math.floor(opportunity.tvlUsd / 10)));

        let txHash = `demo-${Date.now().toString(16)}`;

        if (simple) {
          const result = await simple.createPolicy({
            holder: address,
            coverageAmount: BigInt(coverageUsd),
            premiumAmount: BigInt(Math.max(1, Math.floor(coverageUsd * 0.02))),
            duration: 60 * 60 * 24 * 90, // 90 days
            riskLevel: RiskLevel.Low,
          });

          if ((result as any).transactionHash && !(result as any).xdr) {
            txHash = result.transactionHash || txHash;
          } else if ((result as any).hash || (result as any).xdr) {
            const signed = await signAndSend({
              xdr: (result as any).xdr,
              rpcUrl: "https://soroban-testnet.stellar.org",
            });
            txHash = signed.hash || txHash;
          } else if (result.error) {
            txHash = `fallback-${Date.now().toString(16)}`;
          }
        } else {
          const signed = await signAndSend({
            contract: opportunity.id,
            coverageUsd,
          });
          txHash = signed.hash || txHash;
        }

        const updated = {
          ...insured,
          [opportunity.id]: { txHash, ts: Date.now() },
        };

        setInsured(updated);
        persistToStorage(address, updated);

        return { success: true as const, txHash };
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        setInsuring(false);
      }
    },
    [address, connect, insured, insuring, signAndSend],
  );

  const insuredIds = useMemo(() => Object.keys(insured), [insured]);

  return {
    insuredIds,
    isInsured,
    insure,
    insuring,
    hasWallet: Boolean(address),
  };
}
