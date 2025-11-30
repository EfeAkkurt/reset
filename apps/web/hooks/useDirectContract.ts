import { useCallback, useState } from 'react';
import { useStellarWallet } from '@/components/providers/StellarWalletProvider';
import { directContractClient, DirectContractCall } from '@/lib/direct-contract-client';

export function useDirectContract() {
  const { address, connect, signAndSend } = useStellarWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Execute contract function directly (bypasses unreliable SDK)
   */
  const executeContractFunction = useCallback(
    async (
      contractId: string,
      method: string,
      args: any[],
      options?: {
        simulate?: boolean;
        onProgress?: (message: string) => void;
      }
    ) => {
      if (!address) {
        await connect();
        return { success: false, error: 'Wallet not connected' };
      }

      setIsProcessing(true);
      options?.onProgress?.('Preparing contract transaction...');

      try {
        // Create the contract call
        const contractCall: DirectContractCall = {
          contractId,
          method,
          args,
          sourceAccount: address,
          networkPassphrase: 'Test SDF Network ; September 2015',
          fee: '100',
        };

        options?.onProgress?.('Building transaction...');

        if (options?.simulate) {
          // For simulation, just return the transaction XDR
          const xdr = directContractClient.getTransactionXDR(contractCall);
          return {
            success: true,
            result: { transactionXDR: xdr, simulation: true },
          };
        }

        options?.onProgress?.('Requesting wallet signature...');

        // Sign and send through wallet
        const transactionXDR = directContractClient.getTransactionXDR(contractCall);
        const result = await signAndSend({
          xdr: transactionXDR,
          rpcUrl: 'https://soroban-testnet.stellar.org',
        });

        options?.onProgress?.('Transaction submitted successfully!');

        return {
          success: true,
          result: {
            transactionHash: result.hash,
            transactionXDR,
          },
        };

      } catch (error) {
        console.error('Direct contract execution failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Contract execution failed',
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [address, connect, signAndSend]
  );

  /**
   * Simple deposit function
   */
  const deposit = useCallback(
    async (
      contractId: string,
      amount: string | number,
      insurancePercentage: number = 0,
      onProgress?: (message: string) => void
    ) => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      return executeContractFunction(
        contractId,
        'deposit',
        [address, amount.toString(), insurancePercentage],
        { onProgress }
      );
    },
    [address, executeContractFunction]
  );

  /**
   * Simple insurance function
   */
  const createInsurancePolicy = useCallback(
    async (
      contractId: string,
      coverageAmount: string | number,
      premiumAmount: string | number,
      duration: number = 60 * 60 * 24 * 90, // 90 days
      onProgress?: (message: string) => void
    ) => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      return executeContractFunction(
        contractId,
        'create_policy',
        [address, coverageAmount.toString(), premiumAmount.toString(), duration],
        { onProgress }
      );
    },
    [address, executeContractFunction]
  );

  return {
    executeContractFunction,
    deposit,
    createInsurancePolicy,
    isProcessing,
    isConnected: !!address,
  };
}