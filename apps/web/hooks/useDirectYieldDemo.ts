import { useCallback, useEffect, useState } from "react";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";
import { toast } from "sonner";
import { useDirectContract } from "@/hooks/useDirectContract";

type DepositState = {
  depositId?: string;
  amount: number;
  insurancePct: number;
  txHash?: string;
};

const STORAGE_KEY = "reset_yield_demo_v1";

const loadState = (addr: string | null): DepositState | null => {
  if (!addr) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${addr}`);
    return raw ? (JSON.parse(raw) as DepositState) : null;
  } catch {
    return null;
  }
};

const persistState = (addr: string, state: DepositState) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${addr}`, JSON.stringify(state));
  } catch {
    // Ignore quota errors for demo
  }
};

// Your contract IDs from the existing configuration
const YIELD_AGGREGATOR_CONTRACT_ID = "CB5HXIT4SWNMWOPW67D66PA2AFRYGYLIBGDRQSHWVDW2GHMGGAQG27YD";

export function useDirectYieldDemo() {
  const { address, connect } = useStellarWallet();
  const { deposit: directDeposit } = useDirectContract();
  const [state, setState] = useState<DepositState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setState(loadState(address));
  }, [address]);

  const deposit = useCallback(
    async (amount: number, insurancePct: number) => {
      if (!address) {
        await connect();
        return { success: false, error: 'Wallet not connected' };
      }
      if (pending) {
        return { success: false, error: 'Transaction already in progress' };
      }

      setPending(true);

      // Show progress toast
      const toastId = toast.loading('Starting deposit transaction...');

      try {
        const result = await directDeposit(
          YIELD_AGGREGATOR_CONTRACT_ID,
          amount,
          insurancePct,
          (message) => {
            // Update toast message
            toast.loading(message, { id: toastId });
          }
        );

        toast.dismiss(toastId);

        if (result.success) {
          const newState: DepositState = {
            amount,
            insurancePct,
            txHash: result.result?.transactionHash,
          };

          setState(newState);
          persistState(address, newState);

          toast.success('Deposit successful! 🎉', {
            description: `Transaction: ${result.result?.transactionHash?.slice(0, 16)}...`,
          });

          return { success: true, result: result.result };
        } else {
          toast.error(result.error || 'Deposit failed');
          return { success: false, error: result.error };
        }
      } catch (error) {
        toast.dismiss(toastId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Deposit failed: ${errorMessage}`);
        return { success: false, error: errorMessage };
      } finally {
        setPending(false);
      }
    },
    [address, connect, directDeposit, pending]
  );

  const clearState = useCallback(() => {
    if (!address) return;
    localStorage.removeItem(`${STORAGE_KEY}:${address}`);
    setState(null);
  }, [address]);

  return {
    deposit,
    clearState,
    state,
    pending,
    isConnected: !!address,
    hasActiveDeposit: !!state?.txHash,
  };
}