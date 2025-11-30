/**
 * Direct Stellar Contract Client - 2025 Best Practices
 * Bypasses unreliable SDK for direct contract signing
 */

import { xdr, nativeToScVal, Address } from '@stellar/stellar-base';

export interface DirectContractCall {
  contractId: string;
  method: string;
  args: any[];
  sourceAccount: string;
  networkPassphrase?: string;
  fee?: string;
}

export interface DirectSignResult {
  signedTransactionXDR: string;
  transactionHash: string;
}

/**
 * Creates a direct contract invocation transaction using latest 2025 patterns
 */
export class DirectStellarContractClient {
  private networkPassphrase: string;

  constructor() {
    // Default to testnet for demo purposes
    this.networkPassphrase = 'Test SDF Network ; September 2015';
  }

  /**
   * Build transaction for contract function invocation
   */
  buildContractTransaction(call: DirectContractCall): xdr.Transaction {
    const { contractId, method, args, sourceAccount, fee = '100' } = call;

    // Validate inputs
    if (!contractId || !method || !args || !sourceAccount) {
      throw new Error('Missing required parameters for contract call');
    }

    // Convert arguments to ScVal format
    const scArgs = this.convertArgsToScVal(args);

    // Create the host function for contract invocation
    const contractAddress = Address.fromString(contractId).toScAddress();
    const functionName = xdr.ScSymbol.scValFromStr(method);

    const hostFunction = xdr.HostFunction.hostFunctionTypeInvokeContract(
      new xdr.InvokeContractArgs({
        contractAddress,
        functionName,
        args: scArgs,
      })
    );

    // For demo purposes, we'll create a mock transaction structure
    // In reality, you'd need to build the full transaction with proper sequence number
    const transaction = new xdr.Transaction({
      sourceAccount: new xdr.MuxedAccountEd25519({
        id: Address.fromString(sourceAccount).ed25519(),
      }),
      fee: xdr.Int64.fromString(fee),
      seqNum: xdr.SequenceNumber.fromString('1234567890'), // You'd get this from Horizon
      memo: new xdr.Memo(xdr.MemoType.memoNone()),
      operations: [
        new xdr.Operation({
          body: xdr.OperationBody.operationInvokeHostFunction({
            hostFunction,
            auth: [],
          }),
        }),
      ],
      cond: new xdr.Preconditions(
        new xdr.Preconditions.precondTime(new xdr.TimePoint({
          minTime: new xdr.Uint64([0, 0, 0, 0]),
          maxTime: new xdr.Uint64([0, 0, 0, 0]),
        }))
      ),
      ext: new xdr.ExtensionPoint(0),
    });

    return transaction;
  }

  /**
   * Convert arguments to proper ScVal format
   */
  private convertArgsToScVal(args: any[]): xdr.ScVal[] {
    return args.map((arg, index) => {
      if (typeof arg === 'string') {
        // Check if it's a Stellar address
        if (arg.startsWith('G')) {
          return Address.fromString(arg).toScVal();
        } else {
          // String argument
          return nativeToScVal(arg, { type: 'string' });
        }
      } else if (typeof arg === 'number') {
        // Number argument
        return nativeToScVal(arg, { type: 'i128' });
      } else if (typeof arg === 'bigint') {
        // BigInt argument
        return nativeToScVal(arg, { type: 'i128' });
      } else if (typeof arg === 'boolean') {
        // Boolean argument
        return nativeToScVal(arg, { type: 'bool' });
      } else {
        throw new Error(`Unsupported argument type at index ${index}: ${typeof arg}`);
      }
    });
  }

  /**
   * Get transaction XDR for wallet signing
   */
  getTransactionXDR(call: DirectContractCall): string {
    const transaction = this.buildContractTransaction(call);
    return transaction.toXDR('base64');
  }

  /**
   * Create a simple deposit transaction for demo
   */
  createDepositTransaction(
    contractId: string,
    userAddress: string,
    amount: string | number,
    insurancePercentage: number = 0
  ): DirectContractCall {
    return {
      contractId,
      method: 'deposit',
      args: [userAddress, amount.toString(), insurancePercentage],
      sourceAccount: userAddress,
      networkPassphrase: this.networkPassphrase,
      fee: '100',
    };
  }

  /**
   * Create a simple insurance policy transaction for demo
   */
  createInsuranceTransaction(
    contractId: string,
    userAddress: string,
    coverageAmount: string | number,
    premiumAmount: string | number,
    duration: number
  ): DirectContractCall {
    return {
      contractId,
      method: 'create_policy',
      args: [userAddress, coverageAmount.toString(), premiumAmount.toString(), duration],
      sourceAccount: userAddress,
      networkPassphrase: this.networkPassphrase,
      fee: '100',
    };
  }
}

// Export singleton instance
export const directContractClient = new DirectStellarContractClient();