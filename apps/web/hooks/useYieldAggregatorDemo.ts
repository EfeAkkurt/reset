import { useCallback, useEffect, useState } from "react";
import { useStellarWallet } from "@/components/providers/StellarWalletProvider";
import { toast } from "sonner";
import { TransactionBuilder, Operation, Asset, Account, Memo, TimeoutInfinite } from "@stellar/stellar-sdk";

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
  const { address, connect, signAndSend } = useStellarWallet();
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
        let txHash = `demo-${Date.now().toString(16)}`;
        let depositId = `demo-${Date.now().toString(16)}`;

        // Build a simple self-payment to trigger wallet signing
        const horizon = "https://horizon-testnet.stellar.org";
        const resp = await fetch(`${horizon}/accounts/${address}`);
        if (!resp.ok) throw new Error(`Account fetch failed: ${resp.status}`);
        const acct = await resp.json();
        const seq = acct?.sequence;
        if (!seq) throw new Error("Account sequence missing");

        const account = new Account(address, seq);
        const networkPassphrase = "Test SDF Network ; September 2015";
        const tx = new TransactionBuilder(account, {
          fee: "100",
          networkPassphrase,
        })
          .addMemo(Memo.text("RESET Yield Option"))
          .addOperation(
            Operation.payment({
              destination: address,
              asset: Asset.native(),
              amount: String(Math.max(1, Math.floor(amount))),
            }),
          )
          .setTimeout(TimeoutInfinite)
          .build();

        const xdr = tx.toXDR();
        const signed = await signAndSend({
          xdr,
          rpcUrl: horizon,
          networkPassphrase,
        });
        txHash = signed.hash || txHash;

        const next: DepositState = { depositId, amount, insurancePct, txHash };
        setState(next);
        persistState(address, next);
        toast.success("Deposit submitted");
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
