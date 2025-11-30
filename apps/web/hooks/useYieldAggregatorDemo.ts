import { useCallback, useEffect, useState } from "react";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";
import { toast } from "sonner";
import { getResetSdk } from "@/lib/sdk/resetSdk";

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

export function useYieldAggregatorDemo() {
  const { address, connect } = useStellarWallet();
  const [state, setState] = useState<DepositState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setState(loadState(address));
  }, [address]);

  const deposit = useCallback(
    async (amount: number, insurancePct: number) => {
      if (!address) {
        await connect();
        return;
      }
      if (pending) return;
      setPending(true);

      try {
        const sdk = getResetSdk();
        const agg = sdk.getYieldAggregator();
        let txHash = `demo-${Date.now().toString(16)}`;
        let depositId = `demo-${Date.now().toString(16)}`;

        if (agg) {
          const op = await agg.deposit({
            user: address,
            amount: Math.max(1, Math.floor(amount)),
            insurancePercentage: Math.max(0, Math.min(100, Math.floor(insurancePct))),
          });

          if ((op as any).xdr) {
            const signed = await signAndSend({
              xdr: (op as any).xdr,
              rpcUrl: "https://soroban-testnet.stellar.org",
            });
            txHash = signed.hash || txHash;
          } else if (op.success) {
            txHash = op.transactionHash || txHash;
            depositId = op.result?.poolId || depositId;
          } else if (op.error) {
            toast.error("Deposit failed", { description: op.error });
          }
        }

        const next: DepositState = { depositId, amount, insurancePct, txHash };
        setState(next);
        persistState(address, next);
        toast.success("Deposit submitted", {
          description: txHash ? `Tx hash: ${txHash}` : undefined,
        });
      } catch (error) {
        toast.error("Deposit failed", {
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPending(false);
      }
    },
    [address, connect, pending],
  );

  const addYield = useCallback(
    async (increment: number) => {
      if (!address || !state?.depositId) return;
      const updated: DepositState = {
        ...state,
        amount: state.amount + increment,
      };
      setState(updated);
      persistState(address, updated);
      toast.success("Yield credited", { description: `+${increment} units` });
    },
    [address, state],
  );

  return {
    state,
    pending,
    deposit,
    addYield,
    hasWallet: Boolean(address),
  };
}
