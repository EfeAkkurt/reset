import { useCallback, useEffect, useState } from "react";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";
import { toast } from "sonner";
import { useDirectContract } from "@/hooks/useDirectContract";

type InsuranceState = {
  policyId?: string;
  coverageAmount: number;
  premiumAmount: number;
  txHash?: string;
};

const STORAGE_KEY = "reset_insurance_demo_v1";

const loadState = (addr: string | null): InsuranceState | null => {
  if (!addr) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${addr}`);
    return raw ? (JSON.parse(raw) as InsuranceState) : null;
  } catch {
    return null;
  }
};

const persistState = (addr: string, state: InsuranceState) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${addr}`, JSON.stringify(state));
  } catch {
    // Ignore quota errors for demo
  }
};

// Your contract ID from the existing configuration
const SIMPLE_INSURANCE_CONTRACT_ID = "CCZHH3REOS3222YNXMO3SHEAHFWMPEPB6VH3K7TME6P4CCJQ3H7BNXWP";

export function useDirectInsurance() {
  const { address, connect } = useStellarWallet();
  const { createInsurancePolicy: directCreatePolicy } = useDirectContract();
  const [state, setState] = useState<InsuranceState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setState(loadState(address));
  }, [address]);

  const createPolicy = useCallback(
    async (
      coverageAmount: number,
      premiumAmount: number,
      duration: number = 60 * 60 * 24 * 90 // 90 days default
    ) => {
      if (!address) {
        await connect();
        return { success: false, error: 'Wallet not connected' };
      }
      if (pending) {
        return { success: false, error: 'Transaction already in progress' };
      }

      setPending(true);

      // Show progress toast
      const toastId = toast.loading('Creating insurance policy...');

      try {
        const result = await directCreatePolicy(
          SIMPLE_INSURANCE_CONTRACT_ID,
          coverageAmount,
          premiumAmount,
          duration,
          (message) => {
            // Update toast message
            toast.loading(message, { id: toastId });
          }
        );

        toast.dismiss(toastId);

        if (result.success) {
          const newState: InsuranceState = {
            coverageAmount,
            premiumAmount,
            txHash: result.result?.transactionHash,
          };

          setState(newState);
          persistState(address, newState);

          toast.success('Insurance policy created! 🛡️', {
            description: `Transaction: ${result.result?.transactionHash?.slice(0, 16)}...`,
          });

          return { success: true, result: result.result };
        } else {
          toast.error(result.error || 'Policy creation failed');
          return { success: false, error: result.error };
        }
      } catch (error) {
        toast.dismiss(toastId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Policy creation failed: ${errorMessage}`);
        return { success: false, error: errorMessage };
      } finally {
        setPending(false);
      }
    },
    [address, connect, directCreatePolicy, pending]
  );

  const clearState = useCallback(() => {
    if (!address) return;
    localStorage.removeItem(`${STORAGE_KEY}:${address}`);
    setState(null);
  }, [address]);

  return {
    createPolicy,
    clearState,
    state,
    pending,
    isConnected: !!address,
    hasActivePolicy: !!state?.txHash,
  };
}